import { queryOptions } from "@tanstack/react-query";
import {
	getMovieCredits,
	getMovieDetails,
	getPopularMovies,
	getTopRatedMovies,
	getTrendingMovies,
	getUpcomingMovies,
} from "./services";
//Currently unsused quries, but used for: const { data, isPending, error } = useQuery(topRatedMoviesQuery(1));
//Query options factory
export const popularMoviesQuery = (page: number) =>
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

export const movieDetailsQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId],
		queryFn: () => getMovieDetails(movieId),
		staleTime: 5 * 60 * 1000,
	});
export const movieCreditsQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId, "credits"],
		queryFn: () => getMovieCredits(movieId),
		enabled: !!movieId,
		staleTime: 5 * 60 * 1000,
	});
// ['movie', movieId, 'credits']

// ['movie', movieId, 'similar']

// ['movies', 'search', query, filters]
