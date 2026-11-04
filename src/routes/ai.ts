import {
	chatParamsFromRequest,
	toServerSentEventsResponse,
} from "@tanstack/ai";
import { createFileRoute } from "@tanstack/react-router";

import { enrichMcpResponseStream } from "#/features/assistant/services/enrichMcpResponseStream";
import { generateMcpAssistantResponse } from "#/features/assistant/services/generateMcpAssistantResponse";
import type { AssistantContext } from "#/features/assistant/types/assistantContext";

type UserMessage =
	| {
			parts: readonly { type: string; content?: unknown }[];
	  }
	| {
			content: unknown;
	  }
	| null
	| undefined;

const validateLastUserMessage = (userMessage: UserMessage): string => {
	if (!userMessage) return "";

	if ("parts" in userMessage) {
		return userMessage.parts
			.filter((part) => part.type === "text")
			.map((part) => (typeof part.content === "string" ? part.content : ""))
			.join("");
	}

	return typeof userMessage.content === "string" ? userMessage.content : "";
};

export const Route = createFileRoute("/ai")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const { messages, forwardedProps } =
					await chatParamsFromRequest(request);

				const context: AssistantContext = {
					movieId:
						typeof forwardedProps.movieId === "number"
							? forwardedProps.movieId
							: undefined,
				};

				const lastUserMessage = [...messages]
					.reverse()
					.find((message) => message.role === "user");

				const stream = await generateMcpAssistantResponse({
					userMessage: validateLastUserMessage(lastUserMessage),
					context,
				});

				return toServerSentEventsResponse(enrichMcpResponseStream(stream));
			},
		},
	},
});
