import { useQuery } from "@tanstack/react-query";
import { MovieCard } from "../../components/MovieCard";
import { popularMoviesQuery } from "./queries";

export const PopularMovies = () => {
	const { data, isPending, error } = useQuery(popularMoviesQuery(1));

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<h1>Popular Movies</h1>

			<div>
				{data.results.map((movie) => (
					<MovieCard key={movie.id} movie={movie} />
				))}
			</div>
		</section>
	);
};
