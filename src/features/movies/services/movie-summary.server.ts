import type { MiniMovie } from "@/features/movies/movie.types";
import { fetchTmdb } from "@/features/movies/services/tmdb-client.server";

export async function getMovieSummary(movieId: number): Promise<MiniMovie> {
	const movie = await fetchTmdb<MiniMovie>(
		`/movie/${movieId}`,
		{ language: "en-US" },
		AbortSignal.timeout(15_000),
	);
	return {
		id: movie.id,
		title: movie.title,
		poster_path: movie.poster_path,
		release_date: movie.release_date,
		vote_average: movie.vote_average,
	};
}
