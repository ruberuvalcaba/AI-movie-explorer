import type { AssistantIntent } from "#/features/assistant/types/assistantIntent";
import type { AssistantResult } from "#/features/assistant/types/assistantResult";
import {
	getMovieDetails,
	getMovieRecommendations,
	searchMovieByTitle,
} from "#/features/movies/services";
import type { Movie } from "#/types/movie";
import type { AssistantContext } from "../types/assistantContext";

export async function executeAssistantIntent(
	intent: AssistantIntent,
	context: AssistantContext,
): Promise<AssistantResult> {
	switch (intent.type) {
		case "explain_movie":
			return explainMovie(intent, context);

		case "recommend_movies":
			return recommendMovies(intent, context);
	}
}

async function explainMovie(
	intent: Extract<AssistantIntent, { type: "explain_movie" }>,
	context: AssistantContext,
): Promise<AssistantResult> {
	let movie: Movie | null = null;

	if (intent.movieTitle) {
		const response = await searchMovieByTitle(intent.movieTitle);
		movie = response.results[0] ?? null;
	} else if (context.movieId) {
		movie = await getMovieDetails(context.movieId);
	} else {
		throw new Error("Which movie would you like to know about?");
	}

	if (!movie) {
		throw new Error(`Movie not found: ${intent.movieTitle}`);
	}

	return {
		movie,
		movies: [],
	};
}

async function recommendMovies(
	intent: Extract<AssistantIntent, { type: "recommend_movies" }>,
	context: AssistantContext,
): Promise<AssistantResult> {
	let movieId: number | null = null;
	if (intent.movieTitle) {
		// User explicitly specified a movie.
		const response = await searchMovieByTitle(intent.movieTitle);
		const movie = response.results[0] ?? null;
		movieId = movie?.id ?? null;
	} else if (context.movieId) {
		// User implicitly means the current movie.
		movieId = context.movieId;
	} else {
		// We don't know what movie they mean.
		throw new Error("Which movie would you like recommendations based on?");
	}

	if (!movieId) {
		throw new Error(`Movie not found: ${intent.movieTitle ?? "current movie"}`);
	}

	const recommendations = await getMovieRecommendations(movieId);

	return {
		movie: null,
		movies: recommendations.results,
	};
}
