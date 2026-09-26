import { Film } from "lucide-react";

export const MovieSpinner = () => {
	return (
		<div className="flex items-center justify-center p-8">
			<div className="relative h-16 w-16">
				{/* Ambient glow */}
				<div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl" />

				{/* Outer ring */}
				<div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl" />

				{/* Spinning reel */}
				<div className="relative flex h-full w-full animate-spin items-center justify-center duration-1000">
					<Film size={38} strokeWidth={1.5} className="text-white/80" />
				</div>

				{/* Center glow */}
				<div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
			</div>
		</div>
	);
};
