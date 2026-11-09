import { useMemo } from "react";
import { MovieContainer } from "#/components/MovieContainer";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { MovieSpinner } from "#/components/MovieSpinner";
import { getUpcomingMoviesServerFn } from "../api/movie.functions";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";

export const UpcomingMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedFetch(["movies", "upcoming"], (page) =>
		getUpcomingMoviesServerFn({ data: { page } }),
	);

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
				displayArrow={true}
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
