import { queryOptions } from "@tanstack/react-query";
import {
	getPopularMovies,
	getTopRatedMovies,
	getTrendingMovies,
	getUpcomingMovies,
} from "./services";

export const popularMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "popular", page],
		queryFn: () => getPopularMovies(page),
	});

export const topRatedMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "top_rated", page],
		queryFn: () => getTopRatedMovies(page),
	});

export const trendingMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "trending", page],
		queryFn: () => getTrendingMovies(page),
	});

export const upcomingMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "upcoming", page],
		queryFn: () => getUpcomingMovies(page),
	});
// ['movie', movieId]

// ['movie', movieId, 'credits']

// ['movie', movieId, 'similar']

// ['movies', 'search', query, filters]
