import { useMemo } from "react";
import { MovieSpinner } from "#/components/MovieSpinner";
import { MovieContainer } from "@/components/MovieContainer";
import { MovieSectionHeader } from "@/components/MovieSectionHeader";
import { getPopularMoviesServerFn } from "../api/movie.functions";
import { usePaginatedFetch } from "../hooks/usePaginatedFetch";

export const PopularMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedFetch(["movies", "popular"], (page) =>
		getPopularMoviesServerFn({ data: { page } }),
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
			<MovieSectionHeader title="Popular Movies" count={`${movies?.length}+`} />
			<MovieContainer
				movies={movies}
				fetchNextPage={fetchNextPage}
				isFetchingNextPage={isFetchingNextPage}
				hasNextPage={hasNextPage}
			/>
		</section>
	);
};
