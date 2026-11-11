import { queryOptions } from "@tanstack/react-query";
import { getSavedMovies } from "./api/collection.functions";

import type { MovieCollection } from "./collection.types";

export const savedMovieKeys = {
	all: (userId: string | undefined, category: MovieCollection) =>
		["private", userId ?? "anonymous", "savedMovies", category] as const,
};

export const savedMoviesQuery = (
	userId: string | undefined,
	category: MovieCollection = "watchlist",
) =>
	queryOptions({
		queryKey: savedMovieKeys.all(userId, category),
		queryFn: ({ signal }) => getSavedMovies({ data: { category }, signal }),
		enabled: Boolean(userId),
		// All cards share this data; avoid a new fetch for each later-mounted card.
		staleTime: 30_000,
		refetchOnWindowFocus: "always",
		retry: false,
	});
