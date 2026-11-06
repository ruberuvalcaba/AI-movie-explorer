import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/database.types";
import type { SavedMovie } from "../watchlist.types";

type Client = SupabaseClient<Database>;

export async function readSavedMovies(
	supabase: Client,
	userId: string,
): Promise<SavedMovie[]> {
	const movies: SavedMovie[] = [];
	let offset = 0;
	// Read every page even when the project's API cap is below the requested size.
	while (true) {
		const { data, error, count } = await supabase
			.from("saved_movies")
			.select("tmdb_movie_id, added_at", { count: "exact" })
			.eq("user_id", userId)
			.order("added_at", { ascending: false })
			.order("tmdb_movie_id", { ascending: true })
			.range(offset, offset + 499);
		if (error || !data || count === null)
			throw new Error("Unable to load your watchlist. Please try again.");
		movies.push(...data);
		offset += data.length;
		if (!data.length || offset >= count) return movies;
	}
}

export async function insertSavedMovie(
	supabase: Client,
	userId: string,
	movieId: number,
) {
	const { error } = await supabase
		.from("saved_movies")
		.insert({ user_id: userId, tmdb_movie_id: movieId });
	// An existing primary key is already the requested state; preserve its save date.
	if (error && error.code !== "23505")
		throw new Error("Unable to save this movie. Please try again.");
	return { movieId };
}

export async function destroySavedMovie(
	supabase: Client,
	userId: string,
	movieId: number,
) {
	const { error } = await supabase
		.from("saved_movies")
		.delete()
		.eq("user_id", userId)
		.eq("tmdb_movie_id", movieId);
	if (error) throw new Error("Unable to remove this movie. Please try again.");
	return { movieId };
}
