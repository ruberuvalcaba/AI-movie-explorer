// ai.ts  → AI conversations
import {
	chat,
	chatParamsFromRequest,
	toServerSentEventsResponse,
} from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ai")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { messages, threadId, runId } =
					await chatParamsFromRequest(request);

				const stream = chat({
					adapter: geminiText("gemini-3.8-flash"),
					messages,
					threadId,
					runId,
				});

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
