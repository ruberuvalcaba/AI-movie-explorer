import type { MovieResponse } from "../../types/movie";
import { movieApi } from "./api";

export const getPopularMovies = (page = 1) => {
	return movieApi<MovieResponse>("/movie/popular", {
		language: "en-US",
		page: String(page),
	});
};

export const getTopRatedMovies = (page = 1) => {
	return movieApi<MovieResponse>("/movie/top_rated", {
		language: "en-US",
		page: String(page),
	});
};

export const getTrendingMovies = (page = 1) => {
	return movieApi<MovieResponse>("/trending/movie/day", {
		language: "en-US",
		page: String(page),
	});
};

export const getUpcomingMovies = (page = 1) => {
	return movieApi<MovieResponse>("/movie/upcoming", {
		language: "en-US",
		page: String(page),
	});
};
