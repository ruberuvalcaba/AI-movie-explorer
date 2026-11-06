import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyWatchlist } from "#/features/movies/components/MyWatchList";

export const Route = createFileRoute("/watchlist")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({ to: "/login", search: { redirect: "/watchlist" } });
	},
	component: MyWatchlist,
});
