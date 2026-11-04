import type { Movie, MovieCredits, MovieResponse } from "../../types/movie";
import { movieApiServer } from "./api/movie.server";

export const getPopularMovies = (page: number): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>("/movie/popular", {
		language: "en-US",
		page: String(page),
	});
};

export const getTopRatedMovies = (page: number): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>("/movie/top_rated", {
		language: "en-US",
		page: String(page),
	});
};

export const getTrendingMovies = (page: number): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>("/trending/movie/day", {
		language: "en-US",
		page: String(page),
	});
};

export const getUpcomingMovies = (page: number): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>("/movie/upcoming", {
		language: "en-US",
		page: String(page),
	});
};

export const getMovieDetails = (movieId: number): Promise<Movie> => {
	return movieApiServer<Movie>(`/movie/${movieId}`, {
		language: "en-US",
		// append_to_response: "videos",
	});
};
export const getMovieCredits = async (movieId: number) => {
	return movieApiServer<MovieCredits>(`/movie/${movieId}/credits`, {
		language: "en-US",
	});
};
export const searchMovieByTitle = async (
	title: string,
): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>(`/search/movie`, {
		language: "en-US",
		query: title,
		include_adult: "false",
		page: "1",
	});
};
export const getMovieRecommendations = async (
	movieId: number,
): Promise<MovieResponse> => {
	return movieApiServer<MovieResponse>(`/movie/${movieId}/recommendations`, {
		language: "en-US",
	});
};
