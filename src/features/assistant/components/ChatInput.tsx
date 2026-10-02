import { ArrowUp } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
	onSubmit: (message: string) => void;
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
	const [message, setMessage] = useState("");

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmedMessage = message.trim();

		if (!trimmedMessage) return;

		onSubmit(trimmedMessage);
		setMessage("");
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="flex items-center gap-2 border-t border-white/10 p-3"
		>
			<input
				value={message}
				onChange={(event) => setMessage(event.target.value)}
				placeholder="Ask about movies..."
				className="
					min-w-0
					flex-1
					bg-transparent
					px-2
					py-2
					text-sm
					text-white
					outline-none
					placeholder:text-white/40
				"
			/>

			<button
				type="submit"
				disabled={!message.trim()}
				className="
					flex
					h-9
					w-9
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
	);
};
