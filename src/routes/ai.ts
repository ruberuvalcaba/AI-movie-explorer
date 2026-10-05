// ai.ts  → AI conversations
import {
	chat,
	chatParamsFromRequest,
	toServerSentEventsResponse,
} from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";
import { createFileRoute } from "@tanstack/react-router";
import { executeAssistantIntent } from "#/features/assistant/services/executeAssistantIntent";
import { generateAssistantResponse } from "#/features/assistant/services/generateAssistantResponse";
import { assistantIntentSchema } from "#/features/assistant/types/assistantIntent";

const SYSTEM_PROMPT = `
You are the intent classifier for an AI Movie Assistant.

Your job is to determine what the user wants regarding movies.

You must return exactly one of these intents:

1. explain_movie
   Use when the user wants information, an explanation, analysis,
   significance, impact, meaning, or details about a specific movie.

2. recommend_movies
   Use when the user wants movie recommendations similar to,
   related to, or based on a specific movie.

Rules:
- Always identify the movie title when possible.
- Do not answer the user's question.
- Do not generate natural-language explanations.
- Only return the structured intent.
`;

export const Route = createFileRoute("/ai")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { messages } = await chatParamsFromRequest(request);
				// 1. Understand the user's request.
				const intent = await chat({
					adapter: geminiText("gemini-3.5-flash-lite"), //The short geminiText() factory automatically looks for GEMINI_API_KEY or GOOGLE_API_KEY in the environment. TanStack's current docs explicitly describe this behavior.
					messages,
					systemPrompts: [SYSTEM_PROMPT],
					outputSchema: assistantIntentSchema,
				});
				// 2. Execute application logic.
				const result = await executeAssistantIntent(intent);

				// 3. Generate the final conversational response.
				const lastUserMessage = [...messages]
					.reverse()
					.find((message) => message.role === "user");

				const stream = generateAssistantResponse({
					userMessage: lastUserMessage?.content ?? "",
					intent,
					result,
				});

				// 4. Stream the final response to the client.
				return toServerSentEventsResponse(stream);
			},
		},
	},
});
/*
* Open AI requires paid credits to work
import {
	chat,
	chatParamsFromRequest,
	toServerSentEventsResponse,
} from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ai")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { messages, threadId, runId } =
					await chatParamsFromRequest(request);

				const stream = chat({
					adapter: openaiText("gpt-5.6"),
					messages,
					threadId,
					runId,
				});

				return toServerSentEventsResponse(stream);
			},
		},
	},
});
*/
