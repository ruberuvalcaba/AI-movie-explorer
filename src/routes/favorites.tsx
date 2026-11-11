import { createFileRoute, redirect } from "@tanstack/react-router";
import { CollectionPage } from "@/features/movies/components/CollectionPage";

export const Route = createFileRoute("/favorites")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({ to: "/login", search: { redirect: "/favorites" } });
	},
	component: () => <CollectionPage category="favorites" />,
});
