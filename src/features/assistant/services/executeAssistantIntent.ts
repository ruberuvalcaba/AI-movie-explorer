import type { AssistantIntent } from "#/features/assistant/types/assistantIntent";
import type { AssistantResult } from "#/features/assistant/types/assistantResult";
import {
	getMovieRecommendations,
	searchMovieByTitle,
} from "#/features/movies/services";

export async function executeAssistantIntent(
	intent: AssistantIntent,
): Promise<AssistantResult> {
	switch (intent.type) {
		case "explain_movie":
			return explainMovie(intent);

		case "recommend_movies":
			return recommendMovies(intent);
	}
}

async function explainMovie(
	intent: Extract<AssistantIntent, { type: "explain_movie" }>,
): Promise<AssistantResult> {
	//TODO: Check if route is movie/movieId or search/movie?query=movieTitle === intent.movieTitle and prevent from fetching.
	const response = await searchMovieByTitle(intent.movieTitle);
	const movie = response.results[0] ?? null;

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
): Promise<AssistantResult> {
	//TODO: Check if route is movie/movieId or search/movie?query=movieTitle === intent.movieTitle and prevent from fetching.
	const response = await searchMovieByTitle(intent.movieTitle);
	const movie = response.results[0] ?? null;

	if (!movie) {
		throw new Error(`Movie not found: ${intent.movieTitle}`);
	}

	const recommendations = await getMovieRecommendations(movie.id);

	return {
		movie,
		movies: recommendations.results,
	};
}
