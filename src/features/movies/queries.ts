import { queryOptions } from "@tanstack/react-query";
import { getPopularMovies } from "./services";

export const popularMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "popular", page],
		queryFn: () => getPopularMovies(page),
	});
