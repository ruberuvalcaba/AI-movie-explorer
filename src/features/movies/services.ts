import type { MovieResponse } from "../../types/movie";
import { movieApi } from "./api";

export const getPopularMovies = (page = 1) => {
	return movieApi<MovieResponse>("/movie/popular", {
		language: "en-US",
		page: String(page),
	});
};
