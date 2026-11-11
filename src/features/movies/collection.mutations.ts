import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	addSavedMovie,
	removeSavedMovie,
} from "@/features/movies/api/collection.functions";
import { savedMovieKeys } from "@/features/movies/collection.queries";
import type { MovieCollection } from "@/features/movies/collection.types";

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
