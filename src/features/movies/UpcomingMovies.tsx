import { useQuery } from "@tanstack/react-query";
import { MovieCarousel } from "@/components/MovieCarousel";
import { upcomingMoviesQuery } from "./queries";

export const UpcomingMovies = () => {
	const { data, isPending, error } = useQuery(upcomingMoviesQuery(1));

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<h1>Upcoming Movies</h1>
			<MovieCarousel movies={data.results} />
		</section>
	);
};
