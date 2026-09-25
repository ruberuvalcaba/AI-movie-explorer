import { create } from "zustand";
import type { Movie } from "@/types/movie";

export const useMovieStore = create((set) => ({
	selectedMovie: null,
	selectMovie: (movie: Movie | null) => set(() => ({ selectedMovie: movie })),
}));
