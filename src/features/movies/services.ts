import type { MovieResponse } from "../../types/movie";
import { movieApi } from "./api";

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
