import type { AssistantIntent } from "#/features/assistant/types/assistantIntent";
import {
	getMovieRecommendations,
	searchMovieByTitle,
} from "#/features/movies/services";

export async function executeAssistantIntent(intent: AssistantIntent) {
	switch (intent.type) {
		case "explain_movie":
			return explainMovie(intent);

		case "recommend_movies":
			return recommendMovies(intent);
	}
}

async function explainMovie(
	intent: Extract<AssistantIntent, { type: "explain_movie" }>,
) {
	const movie = await searchMovieByTitle(intent.movieTitle);
	if (!movie) throw new Error(`Movie not found: ${intent.movieTitle}`);
	return {
		type: "movie",
		movie,
	};
}

async function recommendMovies(
	intent: Extract<AssistantIntent, { type: "recommend_movies" }>,
) {
	const response = await searchMovieByTitle(intent.movieTitle);
	const movie = response.results[0] ?? null;
	console.log("movie", movie);
	if (!movie) {
		throw new Error(`Movie not found: ${intent.movieTitle}`);
	}

	const recommendations = await getMovieRecommendations(movie.id);
	return {
		type: "recommendations",
		movie,
		recommendations,
	};
}
