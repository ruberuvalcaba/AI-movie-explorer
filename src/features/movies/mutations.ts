import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSavedMovie, removeSavedMovie } from "./api/watchlist.functions";
import { savedMovieKeys } from "./watchlist.queries";
import type { MovieCollection } from "./watchlist.types";

export function useAddSavedMovie(userId: string, category: MovieCollection) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...savedMovieKeys.all(userId, category), "add"],
		meta: { private: true, userId },
		mutationFn: (data: { movieId: number }) =>
			addSavedMovie({ data: { ...data, category } }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: savedMovieKeys.all(userId, category),
				exact: true,
			}),
	});
}

export function useRemoveSavedMovie(userId: string, category: MovieCollection) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: [...savedMovieKeys.all(userId, category), "remove"],
		meta: { private: true, userId },
		mutationFn: (data: { movieId: number }) =>
			removeSavedMovie({ data: { ...data, category } }),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: savedMovieKeys.all(userId, category),
				exact: true,
			}),
	});
}
