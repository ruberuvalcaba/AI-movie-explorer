import { Link } from "@tanstack/react-router";
import { Film } from "lucide-react";

export const HomeButton = () => {
	return (
		<Link
			to="/"
			aria-label="Go to home page"
			className="fixed top-3 left-12 flex rounded-full backdrop-blur-xl transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70"
		>
			<span className="relative block h-14 w-14">
				{/* Ambient glow */}
				<span
					aria-hidden="true"
					className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl"
				/>

				{/* Outer ring */}
				<span
					aria-hidden="true"
					className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl"
				/>

				{/* Icon */}
				<span className="relative flex h-full w-full items-center justify-center">
					<Film
						size={30}
						strokeWidth={1.5}
						className="text-white/80"
						aria-hidden="true"
					/>
				</span>

				{/* Center glow */}
				<span
					aria-hidden="true"
					className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
				/>
			</span>
		</Link>
	);
};
