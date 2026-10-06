import type { Movie } from "../../../types/movie";

export interface AssistantResult {
	movie: Movie | null;
	movies: Movie[];
}
