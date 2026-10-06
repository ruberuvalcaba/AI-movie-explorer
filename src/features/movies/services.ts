import type { Movie, MovieCredits, MovieResponse } from "../../types/movie";
import { movieApi } from "./api/movie";

export const getPopularMovies = (page: number): Promise<MovieResponse> => {
	return movieApi<MovieResponse>("/movie/popular", {
		language: "en-US",
		page: String(page),
	});
};

export const getTopRatedMovies = (page: number): Promise<MovieResponse> => {
	return movieApi<MovieResponse>("/movie/top_rated", {
		language: "en-US",
		page: String(page),
	});
};

export const getTrendingMovies = (page: number): Promise<MovieResponse> => {
	return movieApi<MovieResponse>("/trending/movie/day", {
		language: "en-US",
		page: String(page),
	});
};

export const getUpcomingMovies = (page: number): Promise<MovieResponse> => {
	return movieApi<MovieResponse>("/movie/upcoming", {
		language: "en-US",
		page: String(page),
	});
};

export const getMovieDetails = (movieId: number): Promise<Movie> => {
	return movieApi<Movie>(`/movie/${movieId}`, {
		language: "en-US",
		// append_to_response: "videos",
	});
};
export const getMovieCredits = async (movieId: number) => {
	return movieApi<MovieCredits>(`/movie/${movieId}/credits`, {
		language: "en-US",
	});
};
export const searchMovieByTitle = async (
	title: string,
): Promise<MovieResponse> => {
	return movieApi<MovieResponse>(`/search/movie`, {
		language: "en-US",
		query: title,
		include_adult: "false",
		page: "1",
	});
};
export const getMovieRecommendations = async (
	movieId: number,
): Promise<MovieResponse> => {
	return movieApi<MovieResponse>(`/movie/${movieId}/recommendations`, {
		language: "en-US",
	});
};
