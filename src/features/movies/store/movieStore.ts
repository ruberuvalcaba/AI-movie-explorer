import { create } from "zustand";
import type { Movie } from "@/types/movie";

export const useMovieStore = create((set) => ({
	selectedMovie: null,
	hoveredMovie: null,
	setSelectMovie: (movie: Movie | null) =>
		set(() => ({ selectedMovie: movie })),
	setHoveredMovie: (movie: Movie | null) =>
		set(() => ({ hoveredMovie: movie })),
}));
