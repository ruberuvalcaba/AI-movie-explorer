import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/features/auth/auth.middleware";
import {
	collectionInput,
	savedMovieInput,
} from "@/features/movies/collection.schemas";
import {
	destroySavedMovie,
	insertSavedMovie,
	readSavedMovies,
} from "@/features/movies/services/collection.server";

export const getSavedMovies = createServerFn({ method: "GET" })
	.middleware([requireAuth])
	.validator(collectionInput)
	.handler(({ context, data }) =>
		readSavedMovies(context.supabase, context.user.id, data.category),
	);

export const addSavedMovie = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(savedMovieInput)
	.handler(({ context, data }) =>
		insertSavedMovie(
			context.supabase,
			context.user.id,
			data.category,
			data.movieId,
		),
	);

export const removeSavedMovie = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(savedMovieInput)
	.handler(({ context, data }) =>
		destroySavedMovie(
			context.supabase,
			context.user.id,
			data.category,
			data.movieId,
		),
	);
