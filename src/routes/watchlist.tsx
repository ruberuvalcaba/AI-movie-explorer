import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyCollection } from "#/features/movies/components/MyCollection";

export const Route = createFileRoute("/watchlist")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({ to: "/login", search: { redirect: "/watchlist" } });
	},
	component: () => <MyCollection category="watchlist" />,
});
