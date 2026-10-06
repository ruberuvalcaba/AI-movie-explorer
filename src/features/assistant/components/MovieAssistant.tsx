import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";
import { useLocation } from "@tanstack/react-router";
import { ChevronDown, MessageCircle } from "lucide-react";
import { useState } from "react";
import { MovieCard } from "#/components/MovieCard";
import { assistantResponseSchema } from "#/features/assistant/types/assistantResponse";
import { formatAiError } from "../../../utils";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

export const MovieAssistant = () => {
	const [isOpen, setIsOpen] = useState(true);
	const location = useLocation();
	const movieId = location.pathname.match(/^\/movie\/(\d+)$/)?.[1];

	const { messages, sendMessage, isLoading, error } = useChat({
		connection: fetchServerSentEvents("/ai"),
		forwardedProps: {
			movieId: movieId ? Number(movieId) : undefined,
		},
		outputSchema: assistantResponseSchema,
	});

	return (
		<>
			{isOpen ? (
				<div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111116]/90 shadow-2xl backdrop-blur-xl">
					<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
						<div>
							<h2 className="text-sm font-semibold text-white">
								AI Movie Assistant
							</h2>

							<p className="text-xs text-white/40">Ask me about movies</p>
						</div>

						<button
							type="button"
							onClick={() => setIsOpen(false)}
							aria-label="Collapse AI Movie Assistant"
							className="flex cursor-pointer h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
						>
							<ChevronDown size={18} />
						</button>
					</div>

					<div className="flex-1 space-y-3 overflow-y-auto p-4">
						{messages.map((message) =>
							message.parts.map((part, index) => {
								const key = `${message.id}-${index}`;

								if (part.type === "text") {
									return (
										<ChatMessage
											key={key}
											role={message.role === "user" ? "user" : "assistant"}
											content={part.content}
										/>
									);
								}

								if (part.type === "structured-output") {
									const response = part.data;

									if (!response) {
										return null;
									}

									return (
										<div key={key} className="space-y-3">
											<ChatMessage content={response.message} />

											{response?.movies?.length > 0 && (
												<div className="flex gap-3 overflow-x-auto pb-2">
													{response.movies.map((movie) => (
														<div key={movie.id} className="shrink-0">
															<MovieCard movie={movie} isMini={true} />
														</div>
													))}
												</div>
											)}
										</div>
									);
								}

								return null;
							}),
						)}

						{error && (
							<ChatMessage key="error" content={formatAiError(error)} />
						)}

						{isLoading && (
							<div className="text-xs text-white/40">Thinking...</div>
						)}
					</div>

					<ChatInput onSubmit={sendMessage} />
				</div>
			) : (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					aria-label="Open AI Movie Assistant"
					className="group cursor-pointer fixed bottom-6 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-white shadow-[0_0_40px_rgba(168,85,247,0.25)] backdrop-blur-2xl transition-all duration-500 hover:scale-110 hover:border-white/30 hover:bg-white/[0.12] hover:shadow-[0_0_55px_rgba(168,85,247,0.4)]"
				>
					{/* Outer ambient glow */}
					<span className="absolute inset-[-8px] -z-10 rounded-full bg-purple-400/20 blur-xl transition-all duration-500 group-hover:bg-purple-400/30" />

					{/* Animated ring */}
					<span className="absolute inset-[-3px] rounded-full border border-white/10 opacity-70" />

					{/* Inner glass */}
					<span className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/15 via-white/[0.04] to-purple-400/10" />

					{/* AI core */}
					<span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] shadow-[inset_0_0_12px_rgba(255,255,255,0.15)]">
						<MessageCircle
							size={19}
							strokeWidth={1.7}
							className="transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110"
						/>
					</span>

					{/* Tiny status light */}
					<span className="absolute right-[9px] top-[9px] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
				</button>
			)}
		</>
	);
};
/*
User
 ↓
Gemini
 ↓
AssistantIntent
 ↓
┌──────────────────────────────┐
│ Application intent handler   │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ↓                ↓
explain_movie    recommend_movies
       ↓                ↓
    TMDB             TMDB
       ↓                ↓
    result           results
       └───────┬────────┘
               ↓
          Gemini response
*/
