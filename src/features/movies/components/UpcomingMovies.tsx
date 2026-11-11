import { useMemo } from "react";
import { getUpcomingMoviesServerFn } from "@/features/movies/api/movie.functions";
import { MovieRail } from "@/features/movies/components/MovieRail";
import { MovieSectionHeader } from "@/features/movies/components/MovieSectionHeader";
import { MovieSpinner } from "@/features/movies/components/MovieSpinner";
import { usePaginatedFetch } from "@/features/movies/hooks/usePaginatedFetch";

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
			<MovieRail
				movies={movies}
				fetchNextPage={fetchNextPage}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>
		</section>
	);
};
