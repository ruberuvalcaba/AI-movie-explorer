import { chat } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";

import type { AssistantIntent } from "#/features/assistant/types/assistantIntent";

interface GenerateAssistantResponseParams {
	userMessage: string;
	intent: AssistantIntent;
	result: unknown;
}

const SYSTEM_PROMPT = `
You are an AI Movie Assistant.

Answer the user's movie-related request using ONLY the movie data
provided by the application.

Do not invent movie facts, ratings, release dates, genres, actors,
or recommendations.

Be concise, conversational, and useful.

If the user asked for recommendations:
- Explain briefly why the recommended movies are relevant.
- Mention the movie titles clearly.
- Do not claim that a movie is recommended by TMDB for a reason
  that is not supported by the provided data.

If the user asked for an explanation:
- Explain the movie using the provided movie information.
- Do not invent details that are not present in the provided data.
`;

export function generateAssistantResponse({
	intent,
	result,
	userMessage,
}: GenerateAssistantResponseParams) {
	return chat({
		adapter: geminiText("gemini-3.8-flash"),
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
	});
}
