import { createFileRoute, redirect } from "@tanstack/react-router";
import { CollectionPage } from "@/pages/CollectionPage";

export const Route = createFileRoute("/watchlist")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({ to: "/login", search: { redirect: "/watchlist" } });
	},
	component: () => <CollectionPage category="watchlist" />,
});
