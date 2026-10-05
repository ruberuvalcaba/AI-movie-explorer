import { keepPreviousData, queryOptions } from "@tanstack/react-query";
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
		placeholderData: keepPreviousData, //Great UX improvement for pagination. keep showing the previous query's data temporarily instead of replacing it with undefined while the new data is loading.
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
		staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes.
	});
export const movieCreditsQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId, "credits"],
		queryFn: () => getMovieCredits(movieId),
		// enabled: !!movieId, //Use it when implementing dependent-query pattern
		staleTime: 5 * 60 * 1000,
	});

// ['movie', movieId, 'similar']

// ['movies', 'search', query, filters]

export const searchMoviesQuery = (title: string) =>
	queryOptions({
		queryKey: ["movies", "search", title],
		queryFn: () => {
			// Implement your search logic here, possibly calling an API with the query and filters.
			return Promise.resolve([]); // Placeholder for actual search results.
		},
	});
