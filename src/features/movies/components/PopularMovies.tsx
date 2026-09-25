import { MovieContainer } from "@/components/MovieContainer";
import { MovieSectionHeader } from "@/components/MovieSectionHeader";
import { usePaginatedMovies } from "../hooks/usePaginatedMovies";
import { getPopularMovies } from "../services";

export const PopularMovies = () => {
	const {
		data,
		isPending,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePaginatedMovies(["movies", "popular"], getPopularMovies);

	const movies = data?.pages.flatMap((page) => page.results) ?? [];

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<MovieSectionHeader title="Popular Movies" count={movies?.length} />
			<MovieContainer
				movies={movies}
				fetchNextPage={fetchNextPage}
				isFetchingNextPage={isFetchingNextPage}
				hasNextPage={hasNextPage}
			/>
		</section>
	);
};
