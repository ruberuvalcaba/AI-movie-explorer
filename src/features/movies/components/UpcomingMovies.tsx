import { useMemo } from "react";
import { MovieContainer } from "#/components/MovieContainer";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { MovieSpinner } from "#/components/MovieSpinner";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";
import { getUpcomingMovies } from "../services";

export const UpcomingMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedFetch(["movies", "upcoming"], getUpcomingMovies);

	const movies = useMemo(
		() => data?.pages.flatMap((page) => page.results) ?? [],
		[data],
	);

	if (isPending) {
		return <MovieSpinner />;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<MovieSectionHeader
				title="Upcoming Movies"
				count={`${movies?.length}+`}
			/>
			<MovieContainer
				movies={movies}
				fetchNextPage={fetchNextPage}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>
		</section>
	);
};
