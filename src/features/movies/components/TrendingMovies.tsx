import { useMemo } from "react";
import { MovieContainer } from "#/components/MovieContainer";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { MovieSpinner } from "#/components/MovieSpinner";
import { getTrendingMoviesServerFn } from "../api/movie.functions";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";

export const TrendingMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedFetch(["movies", "trending"], (page) =>
		getTrendingMoviesServerFn({ data: { page } }),
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
				title="Trending Movies"
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
