import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { searchMovieByTitle } from "../../features/movies/services.server";

export const searchMoviesTool = toolDefinition({
	name: "search_movies",
	description: "Search the TMDB movie catalog by title.",
	inputSchema: z.object({
		query: z.string().trim().min(1).max(100),
	}),
	outputSchema: z.object({
		movies: z.array(
			z.object({
				id: z.number(),
				title: z.string(),
				poster_path: z.string().nullable(),
			}),
		),
	}),
	metadata: {
		annotations: {
			readOnlyHint: true,
			idempotentHint: true,
		},
	},
}).server(async ({ query }) => {
	const response = await searchMovieByTitle(query);

	return {
		movies: response.results.slice(0, 10).map((movie) => ({
			id: movie.id,
			title: movie.title,
			poster_path: movie.poster_path ?? null,
		})),
	};
});
