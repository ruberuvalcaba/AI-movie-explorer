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

If recommendations are provided:
- Mention that you are recommending movies based on the requested movie.
- Mention the movie titles naturally when useful.
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
