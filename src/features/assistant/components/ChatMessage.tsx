import { Streamdown } from "streamdown";

interface ChatMessageProps {
	role?: "user" | "assistant" | null;
	content: string;
}

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
	const isUser = role === "user";

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`
					max-w-[85%]
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
