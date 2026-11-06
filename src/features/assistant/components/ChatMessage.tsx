import { Streamdown } from "streamdown";

interface ChatMessageProps {
	interaction?: "user" | "assistant" | null;
	content: string;
}

export const ChatMessage = ({ interaction, content }: ChatMessageProps) => {
	const isUser = interaction === "user";

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`
					min-w-0 max-w-[95%] break-words [overflow-wrap:anywhere] sm:max-w-[85%]
					rounded-2xl
					px-4
					py-3
					text-sm
					leading-relaxed
					${isUser ? "bg-white text-black" : "bg-white/10 text-white/90"}
				`}
			>
				{!isUser ? <Streamdown>{content}</Streamdown> : content}
			</div>
		</div>
	);
};
