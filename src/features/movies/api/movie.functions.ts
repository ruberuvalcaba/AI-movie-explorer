import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	getMovieCredits,
	getMovieDetails,
	getPopularMovies,
	getTopRatedMovies,
	getTrendingMovies,
	getUpcomingMovies,
	searchMovieByTitle,
} from "../services.server";
// import { movieApiServer } from "./movie.server";

export const getPopularMoviesServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			page: z.number().int().min(1),
		}),
	)
	.handler(async ({ data }) => {
		return getPopularMovies(data.page);
	});

export const getTopRatedMoviesServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			page: z.number().int().min(1),
		}),
	)
	.handler(async ({ data }) => {
		return getTopRatedMovies(data.page);
	});

export const getTrendingMoviesServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			page: z.number().int().min(1),
		}),
	)
	.handler(async ({ data }) => {
		return getTrendingMovies(data.page);
	});

export const getUpcomingMoviesServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			page: z.number().int().min(1),
		}),
	)
	.handler(async ({ data }) => {
		return getUpcomingMovies(data.page);
	});

export const getMovieDetailsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			movieId: z.number().int().positive(),
		}),
	)
	.handler(async ({ data }) => {
		return getMovieDetails(data.movieId);
	});

export const getMovieCreditsServerFn = createServerFn({
	method: "GET",
})
	.validator(
		z.object({
			movieId: z.number().int().positive(),
		}),
	)
	.handler(async ({ data }) => {
		return getMovieCredits(data.movieId);
	});

export const searchMoviesServerFn = createServerFn({ method: "GET" })
	.validator(
		z.object({
			query: z.string().trim().min(1).max(200),
			page: z.number().int().min(1).default(1),
		}),
	)
	.handler(async ({ data }) => searchMovieByTitle(data.query, data.page));
