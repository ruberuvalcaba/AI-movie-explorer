import { useMutation } from "@tanstack/react-query";
import { saveWatchlistChange } from "./api/watchlist";
import { useWatchlistStore } from "./store/watchlistStore";
/*
 *Mutation → simulates persisting the change to the future backend.
 * onMutate / onError / onSettled → handle the optimistic mutation lifecycle.
 */

export const useToggleWatchlist = (movieId?: number) => {
	const addMovie = useWatchlistStore((state) => state.addMovie);
	const removeMovie = useWatchlistStore((state) => state.removeMovie);

	return useMutation({
		mutationFn: async (action: "add" | "remove") => {
			if (movieId === undefined) {
				throw new Error("Movie ID is required");
			}

			return saveWatchlistChange(movieId, action);
		},

		onMutate: (action) => {
			if (movieId === undefined) {
				return;
			}

			// Optimistic update
			action === "add" ? addMovie(movieId) : removeMovie(movieId);

			// Save the previous state for rollback
			return {
				action,
			};

			// Return rollback function is another option, but not working for this use case.
			// return {
			// 	rollback: () =>
			// 		isInWatchlist ? addMovie(movieId) : removeMovie(movieId),
			// };
		},
		//TanStack Query passes that value to onError: That's how we know what to roll back to.
		onError: (_error, _variables, context) => {
			if (movieId === undefined) {
				return;
			}
			// Restore the state from before the mutation
			context?.action === "add" ? removeMovie(movieId) : addMovie(movieId);

			// Rollback Zustand state
			// context?.rollback();
		},

		onSettled: () => {
			// In a real application:
			// invalidate/refetch server state - invalidateQueries
			/*
			* If eventually watchlist is server-backed through TanStack Query:
			queryClient.invalidateQueries({
				queryKey: ["watchlist"],
			});
			*/
		},
	});
};
