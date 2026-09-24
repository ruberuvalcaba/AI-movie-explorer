import { useQuery } from "@tanstack/react-query";
import { MovieCarousel } from "@/components/MovieCarousel";
import { trendingMoviesQuery } from "./queries";

export const TrendingMovies = () => {
	const { data, isPending, error } = useQuery(trendingMoviesQuery(1));

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<h1>Trending Movies</h1>
			<MovieCarousel movies={data.results} />
		</section>
	);
};
