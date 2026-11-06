import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/features/auth/middleware";
import {
	destroySavedMovie,
	insertSavedMovie,
	readSavedMovies,
} from "../services/watchlist.server";
import { watchlistMovieInput } from "../watchlist.schemas";

export const getSavedMovies = createServerFn({ method: "GET" })
	.middleware([requireAuth])
	.handler(({ context }) => readSavedMovies(context.supabase, context.user.id));

export const addMovieToWatchlist = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(watchlistMovieInput)
	.handler(({ context, data }) =>
		insertSavedMovie(context.supabase, context.user.id, data.movieId),
	);

export const removeMovieFromWatchlist = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(watchlistMovieInput)
	.handler(({ context, data }) =>
		destroySavedMovie(context.supabase, context.user.id, data.movieId),
	);
