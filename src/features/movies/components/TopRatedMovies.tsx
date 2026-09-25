import { MovieContainer } from "#/components/MovieContainer";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { usePaginatedMovies } from "../hooks/usePaginatedMovies";
import { getTopRatedMovies } from "../services";

export const TopRatedMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedMovies(["movies", "top-rated"], getTopRatedMovies);

	const movies = data?.pages.flatMap((page) => page.results) ?? [];

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<MovieSectionHeader title="Top Rated Movies" count={movies?.length} />
			<MovieContainer
				movies={movies}
				fetchNextPage={fetchNextPage}
				hasNextPage={hasNextPage}
				isFetchingNextPage={isFetchingNextPage}
			/>
		</section>
	);
};
