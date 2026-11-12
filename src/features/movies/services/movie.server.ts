import type {
	Movie,
	MovieCredits,
	MovieResponse,
} from "@/features/movies/movie.types";
import { fetchTmdb } from "@/features/movies/services/tmdb-client.server";

export const getPopularMovies = (page: number): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>("/movie/popular", {
		language: "en-US",
		page: String(page),
	});
};

export const getTopRatedMovies = (page: number): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>("/movie/top_rated", {
		language: "en-US",
		page: String(page),
	});
};

export const getTrendingMovies = (page: number): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>("/trending/movie/day", {
		language: "en-US",
		page: String(page),
	});
};

export const getUpcomingMovies = (page: number): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>("/movie/upcoming", {
		language: "en-US",
		page: String(page),
	});
};

export const getMovieDetails = (movieId: number): Promise<Movie> => {
	return fetchTmdb<Movie>(`/movie/${movieId}`, {
		language: "en-US",
		append_to_response: "videos,watch/providers",
	});
};
export const getMovieCredits = async (movieId: number) => {
	return fetchTmdb<MovieCredits>(`/movie/${movieId}/credits`, {
		language: "en-US",
	});
};
export const searchMovieByTitle = async (
	title: string,
	page = 1,
): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>(`/search/movie`, {
		language: "en-US",
		query: title,
		include_adult: "false",
		page: String(page),
	});
};
export const getMovieRecommendations = async (
	movieId: number,
): Promise<MovieResponse> => {
	return fetchTmdb<MovieResponse>(`/movie/${movieId}/recommendations`, {
		language: "en-US",
	});
};
