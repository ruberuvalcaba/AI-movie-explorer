import { queryOptions } from "@tanstack/react-query";
import { getMovieExternalRatings } from "@/features/movies/api/external-ratings.functions";
import {
	EXTERNAL_RATINGS_CACHE_TIME,
	ExternalRatingsError,
	validRatingsMovieId,
} from "@/features/movies/external-ratings.policy";
import type { MovieExternalRatings } from "@/features/movies/external-ratings.types";

const cooldownKey = ["movie-external-ratings", "retry-after"] as const;

export const externalRatingsKey = (movieId: number) =>
	["movie-external-ratings", movieId] as const;

export const externalRatingsQuery = (movieId: number) =>
	queryOptions({
		queryKey: externalRatingsKey(movieId),
		enabled: validRatingsMovieId(movieId),
		queryFn: async ({ signal, client }): Promise<MovieExternalRatings> => {
			const retryAt = client.getQueryData<number>(cooldownKey);
			if (retryAt && retryAt > Date.now())
				throw new ExternalRatingsError("rate-limited", retryAt);
			const result = await getMovieExternalRatings({
				data: { movieId },
				signal,
			});
			if (result.status === "unavailable") {
				if (result.reason === "rate-limited" && result.retryAt) {
					client.setQueryDefaults(cooldownKey, {
						gcTime: Math.max(
							EXTERNAL_RATINGS_CACHE_TIME,
							result.retryAt - Date.now(),
						),
					});
					client.setQueryData(cooldownKey, result.retryAt);
				}
				throw new ExternalRatingsError(result.reason, result.retryAt);
			}
			return result.ratings;
		},
		staleTime: EXTERNAL_RATINGS_CACHE_TIME,
		gcTime: EXTERNAL_RATINGS_CACHE_TIME,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		retry: false,
	});
