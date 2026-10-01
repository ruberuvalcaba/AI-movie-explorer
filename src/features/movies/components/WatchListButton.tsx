import { useNavigate } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { useWatchlistStore } from "../store/watchlistStore.store";

export const WatchlistButton = () => {
	const navigate = useNavigate();
	const movieCount = useWatchlistStore((state) => state.movieIds.length);

	return (
		<button
			type="button"
			onClick={() => navigate({ to: "/watchlist" })}
			aria-label={`My Watchlist${movieCount ? `, ${movieCount} movies` : ""}`}
			title="My Watchlist"
			className="cursor-pointer group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
		>
			<Bookmark
				size={18}
				strokeWidth={1.8}
				className="transition-transform duration-200 group-hover:scale-110"
			/>

			{movieCount > 0 && (
				<span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-semibold text-black">
					{movieCount}
				</span>
			)}
		</button>
	);
};
