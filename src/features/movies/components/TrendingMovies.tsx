import { useMemo } from "react";
import { getTrendingMoviesServerFn } from "@/features/movies/api/movie.functions";
import { MovieRail } from "@/features/movies/components/MovieRail";
import { MovieSectionHeader } from "@/features/movies/components/MovieSectionHeader";
import { MovieSpinner } from "@/features/movies/components/MovieSpinner";
import { usePaginatedFetch } from "@/features/movies/hooks/usePaginatedFetch";

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
				displayArrow={true}
			/>
			<MovieRail
				movies={movies}
				fetchNextPage={fetchNextPage}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>
		</section>
	);
};
