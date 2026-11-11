import {
	infiniteQueryOptions,
	keepPreviousData,
	queryOptions,
} from "@tanstack/react-query";
import {
	getMovieCreditsServerFn,
	getMovieDetailsServerFn,
	getMovieSummaryServerFn,
	getPopularMoviesServerFn,
	getTopRatedMoviesServerFn,
	getTrendingMoviesServerFn,
	getUpcomingMoviesServerFn,
	searchMoviesServerFn,
} from "@/features/movies/api/movie.functions";

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
	infiniteQueryOptions({
		queryKey: ["movies", "search", title.trim()],
		enabled: title.trim().length > 0,
		initialPageParam: 1,
		queryFn: ({ pageParam }) =>
			searchMoviesServerFn({ data: { query: title.trim(), page: pageParam } }),
		getNextPageParam: (lastPage) =>
			lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
		staleTime: 5 * 60 * 1000,
	});

export const movieSummaryQuery = (movieId: number) =>
	queryOptions({
		queryKey: ["movie", movieId, "summary"],
		queryFn: ({ signal }) =>
			getMovieSummaryServerFn({ data: { movieId }, signal }),
		staleTime: 10 * 60_000,
		retry: 1,
	});
