import type { WatchAvailability } from "@/features/movies/movie.types";

const categories = [
	{ key: "flatrate", label: "Stream" },
	{ key: "free", label: "Free" },
	{ key: "ads", label: "Free with ads" },
	{ key: "rent", label: "Rent" },
	{ key: "buy", label: "Buy" },
] as const;

export function getWatchProviderGroups(availability?: WatchAvailability) {
	return categories
		.map(({ key, label }) => ({
			key,
			label,
			providers: [...(availability?.[key] ?? [])].sort(
				(a, b) => a.display_priority - b.display_priority,
			),
		}))
		.filter((group) => group.providers.length > 0);
}
