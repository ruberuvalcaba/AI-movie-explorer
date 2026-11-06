import { ArrowUp, Mic, Square } from "lucide-react";
import { useState } from "react";
import { useVoiceInput } from "../hooks/useVoiceInput";

interface ChatInputProps {
	onSubmit: (message: string) => void;
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
	const [message, setMessage] = useState("");
	const voice = useVoiceInput((text) => {
		setMessage((draft) => [draft.trim(), text].filter(Boolean).join(" "));
	});
	const voiceBusy = voice.status !== "idle";

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedMessage = message.trim();

		if (!trimmedMessage || voiceBusy) return;

		onSubmit(trimmedMessage);
		setMessage("");
	};

	return (
		<div className="shrink-0 border-t border-white/10">
			<form
				onSubmit={handleSubmit}
				className="flex shrink-0 items-center gap-2 p-3"
			>
				<button
					type="button"
					aria-label={
						voice.status === "recording"
							? "Stop recording"
							: "Record voice message"
					}
					title={
						voice.status === "recording"
							? "Stop recording"
							: "Record voice message"
					}
					aria-pressed={voice.status === "recording"}
					disabled={
						voice.status === "requesting" || voice.status === "transcribing"
					}
					onClick={() =>
						voice.status === "recording" ? voice.stop() : void voice.start()
					}
					className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:opacity-40 ${voice.status === "recording" ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
				>
					{voice.status === "recording" ? (
						<Square size={16} fill="currentColor" aria-hidden="true" />
					) : (
						<Mic size={18} aria-hidden="true" />
					)}
				</button>
				<input
					aria-label="Message to movie assistant"
					value={message}
					onChange={(event) => setMessage(event.target.value)}
					placeholder="Ask about movies..."
					className="
					min-w-0
					flex-1
					bg-transparent
					px-2
					py-2
					text-base sm:text-sm
					text-white
					outline-none
					placeholder:text-white/40
				"
				/>

				<button
					type="submit"
					aria-label="Send message"
					disabled={!message.trim() || voiceBusy}
					className="
					flex
					h-11 sm:h-9
					w-11 sm:w-9
					shrink-0
					items-center
					justify-center
					rounded-full
					bg-white
					text-black
					transition-opacity
					disabled:cursor-not-allowed
					disabled:opacity-30
				"
				>
					<ArrowUp size={16} />
				</button>
			</form>
			{voiceBusy && (
				<div className="flex items-center justify-between gap-2 px-3 pb-3 text-xs text-white/70">
					<p aria-live="polite">
						{voice.status === "requesting"
							? "Waiting for microphone permission..."
							: voice.status === "recording"
								? "Recording… stops after 1 minute."
								: "Transcribing… review the text before sending."}
					</p>
					<button
						type="button"
						onClick={voice.cancel}
						className="shrink-0 cursor-pointer rounded px-2 py-2 text-white underline"
					>
						Cancel
					</button>
				</div>
			)}
			{!voiceBusy && !voice.error && (
				<p className="px-3 pb-2 text-xs text-white/50">
					Speak in English or Spanish.
				</p>
			)}
			{voice.error && (
				<p role="alert" className="px-3 pb-3 text-xs text-red-300">
					{voice.error}
				</p>
			)}
		</div>
	);
};
