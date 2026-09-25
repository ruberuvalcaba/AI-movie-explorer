import { MovieContainer } from "#/components/MovieContainer";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { usePaginatedMovies } from "../hooks/usePaginatedMovies";
import { getUpcomingMovies } from "../services";

export const UpcomingMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedMovies(["movies", "upcoming"], getUpcomingMovies);

	const movies = data?.pages.flatMap((page) => page.results) ?? [];

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<MovieSectionHeader title="Upcoming Movies" count={movies?.length} />
			<MovieContainer
				movies={movies}
				fetchNextPage={fetchNextPage}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>
		</section>
	);
};
