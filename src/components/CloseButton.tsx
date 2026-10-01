import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";

export const CloseButton = ({ path }: { path?: string }) => {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			onClick={() => navigate({ to: path || "/" })}
			className="
					fixed right-6 top-6 z-20
					flex h-11 w-11 items-center justify-center
					rounded-full
					border border-white/15
					bg-black/30
					text-white/80
					backdrop-blur-xl
					transition
					hover:bg-white/10
					hover:text-white
					cursor-pointer
				"
			aria-label="Close movie"
		>
			<X size={22} />
		</button>
	);
};
