import { createFileRoute } from "@tanstack/react-router";
import { MyWatchlist } from "#/features/movies/components/MyWatchList";

export const Route = createFileRoute("/watchlist")({
	component: MyWatchlist,
});
