import { create } from "zustand";

interface WatchlistState {
	movieIds: number[];
	addMovie: (movieId: number) => void;
	removeMovie: (movieId: number) => void;
	hasMovie: (movieId: number) => boolean;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
	movieIds: [],

	addMovie: (movieId) =>
		set((state) => ({
			movieIds: state.movieIds.includes(movieId)
				? state.movieIds
				: [...state.movieIds, movieId],
		})),

	removeMovie: (movieId) =>
		set((state) => ({
			movieIds: state.movieIds.filter((id) => id !== movieId),
		})),

	hasMovie: (movieId) => get().movieIds.includes(movieId),
}));
