import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	addMovieToWatchlist,
	removeMovieFromWatchlist,
} from "./api/watchlist.functions";
import { watchlistKeys } from "./watchlist.queries";

export function useAddMovieToWatchlist(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...watchlistKeys.all(userId), "add"],
		meta: { private: true, userId },
		mutationFn: (data: { movieId: number }) => addMovieToWatchlist({ data }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: watchlistKeys.all(userId),
				exact: true,
			}),
	});
}

export function useRemoveMovieFromWatchlist(userId: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...watchlistKeys.all(userId), "remove"],
		meta: { private: true, userId },
		mutationFn: (data: { movieId: number }) =>
			removeMovieFromWatchlist({ data }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: watchlistKeys.all(userId),
				exact: true,
			}),
	});
}
