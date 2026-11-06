import { queryOptions } from "@tanstack/react-query";
import { getSavedMovies } from "./api/watchlist.functions";

export const watchlistKeys = {
	all: (userId?: string) =>
		["private", userId ?? "anonymous", "savedMovies"] as const,
};

export const savedMoviesQuery = (userId?: string) =>
	queryOptions({
		queryKey: watchlistKeys.all(userId),
		queryFn: ({ signal }) => getSavedMovies({ signal }),
		enabled: Boolean(userId),
		// All cards share this data; avoid a new fetch for each later-mounted card.
		staleTime: 30_000,
		refetchOnWindowFocus: "always",
		retry: false,
	});
