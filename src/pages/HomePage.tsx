import { PopularMovies } from "@/features/movies/PopularMovies";
import { TopRatedMovies } from "@/features/movies/TopRatedMovies";
import { TrendingMovies } from "@/features/movies/TrendingMovies";
import { UpcomingMovies } from "@/features/movies/UpcomingMovies";

export const HomePage = () => {
	return (
		<div>
			<h1>Welcome to AI Movie Explorer Home Page</h1>
			<PopularMovies />
			<TopRatedMovies />
			<TrendingMovies />
			<UpcomingMovies />
		</div>
	);
};
