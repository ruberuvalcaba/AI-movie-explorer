import type { Database } from "@/integrations/supabase/database.types";

export type SavedMovie = Pick<
	Database["public"]["Tables"]["saved_movies"]["Row"],
	"tmdb_movie_id" | "added_at"
>;
