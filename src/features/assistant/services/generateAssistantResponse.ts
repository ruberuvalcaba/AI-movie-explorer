import { chat } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";

import type { AssistantIntent } from "#/features/assistant/types/assistantIntent";
import { assistantMessageSchema } from "../types/assistantResponse";

interface GenerateAssistantResponseParams {
	userMessage: string;
	intent: AssistantIntent;
	result: unknown;
}

const SYSTEM_PROMPT = `
You are an AI Movie Assistant.

Generate a concise conversational response to the user's request.

Use ONLY the movie data provided by the application.

Do not invent movie facts, ratings, release dates, genres,
actors, or recommendations.

Return an object containing only:

{
  "message": "..."
}

Recommendation response rules:

- If recommendations are based on an explicitly named movie,
  mention that movie by name when appropriate.

- If recommendations are based on the current movie context
  (movieId) and the user did not explicitly provide a movie title,
  you MUST make it clear that the recommendations are based on
  the movie the user is currently viewing.

- In that case, you may say something like:
  "Here are some movies I recommend based on the movie you're seeing."

- If the current movie's title is available in the provided movie data,
  prefer mentioning the title naturally.

- Keep the response concise because the UI will render the actual
  movie cards separately.

Do not return movie IDs.
Do not return poster paths.
Do not create movie objects.
`;

export function generateAssistantResponse({
	userMessage,
	intent,
	result,
}: GenerateAssistantResponseParams) {
	return chat({
		adapter: geminiText("gemini-3.5-flash-lite"),
		systemPrompts: [SYSTEM_PROMPT],
		messages: [
			{
				role: "user",
				content: JSON.stringify({
					request: userMessage,
					intent,
					movieData: result,
				}),
			},
		],
		outputSchema: assistantMessageSchema,
		stream: true,
	});
}
