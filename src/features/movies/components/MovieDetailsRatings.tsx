import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MovieRatings } from "@/features/movies/components/MovieRatings";
import {
	type ExternalRatingsError,
	validRatingsMovieId,
} from "@/features/movies/external-ratings.policy";
import {
	externalRatingsKey,
	externalRatingsQuery,
} from "@/features/movies/external-ratings.queries";
import type { MovieExternalRatings } from "@/features/movies/external-ratings.types";

export function MovieDetailsRatings({
	movieId,
	score,
	voteCount,
}: {
	movieId: number;
	score: number;
	voteCount: number;
}) {
	const client = useQueryClient();
	const previousError = client.getQueryState<
		MovieExternalRatings,
		ExternalRatingsError
	>(externalRatingsKey(movieId))?.error;
	const mayRequest =
		!previousError ||
		!["unauthorized", "invalid-id", "not-configured"].includes(
			previousError.reason,
		);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	// Optional ratings start after hydration, so SSR and primary details never wait for MDBList.
	const ratings = useQuery({
		...externalRatingsQuery(movieId),
		retryOnMount: mayRequest,
		enabled: mounted && validRatingsMovieId(movieId) && mayRequest,
	});
	return (
		<MovieRatings
			tmdbScore={score}
			tmdbVoteCount={voteCount}
			externalRatings={ratings.data}
			loading={ratings.isFetching && !ratings.data}
		/>
	);
}
