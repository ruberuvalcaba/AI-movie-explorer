import { z } from "zod";
import type { generateMcpAssistantResponse } from "@/features/assistant/services/generateMcpAssistantResponse";

const recommendationsSchema = z.object({
	movies: z.array(
		z.object({
			id: z.number(),
			title: z.string(),
			poster_path: z.string().nullable().optional(),
			release_date: z.string().optional(),
			vote_average: z.number().optional(),
		}),
	),
});

type McpStream = Awaited<ReturnType<typeof generateMcpAssistantResponse>>;

export async function* enrichMcpResponseStream(stream: McpStream) {
	const toolNames = new Map<string, string>();
	const recommendedMovies = new Map<
		number,
		z.infer<typeof recommendationsSchema>["movies"][number]
	>();

	for await (const chunk of stream) {
		if (chunk.type === "TOOL_CALL_START") {
			toolNames.set(chunk.toolCallId, chunk.toolCallName);
		}

		if (
			chunk.type === "TOOL_CALL_RESULT" &&
			toolNames.get(chunk.toolCallId) === "get_movie_recommendations" &&
			typeof chunk.content === "string"
		) {
			try {
				const parsed = recommendationsSchema.safeParse(
					JSON.parse(chunk.content),
				);

				if (parsed.success) {
					for (const movie of parsed.data.movies) {
						recommendedMovies.set(movie.id, movie);
					}
				} else {
					console.warn("[MCP] Invalid recommendations data");
				}
			} catch (error) {
				console.error("[MCP] Failed to parse recommendations:", error);
			}
		}

		if (
			chunk.type === "CUSTOM" &&
			chunk.name === "structured-output.complete"
		) {
			const { message, selectedMovieIds } = chunk.value.object;

			const movies = [...new Set(selectedMovieIds)].flatMap((id) => {
				const movie = recommendedMovies.get(id);
				return movie ? [movie] : [];
			});

			const response = { message, movies };

			yield {
				...chunk,
				value: {
					...chunk.value,
					object: response,
					raw: JSON.stringify(response),
				},
			};

			continue;
		}

		yield chunk;
	}
}
