import { chat } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";

import { createMovieMcpClient } from "#/mcp/mcp-client";
import type { AssistantContext } from "../types/assistantContext";
import { mcpAssistantResponseSchema } from "../types/mcpAssistantResponse";

interface Params {
	userMessage: string;
	context: AssistantContext;
}

const SYSTEM_PROMPT = `
You are an AI Movie Assistant.

You have access to MCP tools for searching movies,
retrieving movie details, and finding recommendations.

Movie resolution:
- If the user explicitly names a movie, search for it to obtain its ID.
- Otherwise, use currentMovieId when available.
- If neither is available, ask for clarification.

Recommendations:
1. Resolve the movie ID.
2. Call get_movie_recommendations using that ID.
3. Use ONLY movies returned by the recommendations tool.
4. Do NOT search for individual recommended movies.
5. Once recommendations are retrieved, STOP calling tools.
6. Generate the final response immediately.

Movie explanations:
- Resolve the movie ID.
- Call get_movie to retrieve details.
- Generate the final response using the retrieved data.

Response rules:
- Return a structured object matching the required output schema.
- Keep the message concise and conversational.
- Never invent movie facts or recommendations.
- Do not generate movie IDs or poster paths in the message.
- Movie cards will be rendered separately by the UI.

Structured response:
- Return a message and selectedMovieIds.
- selectedMovieIds must contain only IDs from MCP tool results.
- For recommendations, select the number of movies requested
  by the user, if enough results are available.
- The message must describe the selected movies.
- Do not include movie IDs in the message.
- Never invent movie IDs.
- For requests without movie recommendations,
  return selectedMovieIds as an empty array.
`;

export async function generateMcpAssistantResponse({
	userMessage,
	context,
}: Params) {
	const mcpClient = await createMovieMcpClient();

	return chat({
		adapter: geminiText("gemini-3.5-flash-lite"),
		systemPrompts: [SYSTEM_PROMPT],
		messages: [
			{
				role: "user",
				content: JSON.stringify({
					request: userMessage,
					currentMovieId: context.movieId ?? null,
				}),
			},
		],
		mcp: {
			clients: [mcpClient],
		},
		outputSchema: mcpAssistantResponseSchema,
		stream: true,
	});
}
