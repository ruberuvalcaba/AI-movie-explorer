import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import {
	getMovieCreditsServerFn,
	getMovieDetailsServerFn,
	getPopularMoviesServerFn,
	getTopRatedMoviesServerFn,
	getTrendingMoviesServerFn,
	getUpcomingMoviesServerFn,
} from "./api/movie.functions";
//Currently unsused quries, but used for: const { data, isPending, error } = useQuery(topRatedMoviesQuery(1));
//Query options factory
export const popularMoviesQuery = (page: number) =>
	queryOptions({
		queryKey: ["movies", "popular", page],
		queryFn: () => getPopularMoviesServerFn({ data: { page } }),
		placeholderData: keepPreviousData, //Great UX improvement for pagination. keep showing the previous query's data temporarily instead of replacing it with undefined while the new data is loading.
	});

export const topRatedMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "top_rated", page],
		queryFn: () => getTopRatedMoviesServerFn({ data: { page } }),
	});

export const trendingMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "trending", page],
		queryFn: () => getTrendingMoviesServerFn({ data: { page } }),
	});

export const upcomingMoviesQuery = (page = 1) =>
	queryOptions({
		queryKey: ["movies", "upcoming", page],
		queryFn: () => getUpcomingMoviesServerFn({ data: { page } }),
	});

export const movieDetailsQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId],
		queryFn: () => getMovieDetailsServerFn({ data: { movieId } }),
		staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes.
	});
export const movieCreditsQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId, "credits"],
		queryFn: () => getMovieCreditsServerFn({ data: { movieId } }),
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
