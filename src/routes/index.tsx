import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/pages/HomePage";

export const Route = createFileRoute("/")({
	component: HomePage,
	validateSearch: (search: Record<string, unknown>): { q?: string } => ({
		q:
			typeof search.q === "string"
				? search.q.trim().slice(0, 200) || undefined
				: undefined,
	}),
});
