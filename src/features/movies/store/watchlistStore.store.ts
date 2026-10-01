import { create } from "zustand";

interface WatchlistState {
	movieIds: number[];
	addMovie: (movieId: number) => void;
	removeMovie: (movieId: number) => void;
	hasMovie: (movieId: number) => boolean;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
	movieIds: [
		278, 1621552, 1423191, 1368337, 1599191, 1375441, 1153576, 1307118, 1255833,
		1492640, 1204680, 1248832,
	],

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
