import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MovieCard } from "#/components/MovieCard";
import type { MiniMovie } from "#/types/movie";
import type { MovieCollection, SavedMovie } from "../collection.types";
import { movieSummaryQuery } from "../queries";
import { SaveMovieToCollection } from "./SaveMovieToCollection";

type GridProps = { entries: SavedMovie[]; category: MovieCollection };
const gridClass =
	"grid grid-cols-3 gap-2 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5";

function CollectionMovie({
	movieId,
	category,
}: {
	movieId: number;
	category: MovieCollection;
}) {
	const queryClient = useQueryClient();
	const query = useQuery({
		...movieSummaryQuery(movieId),
		// Reuse already-loaded full details without ever treating a summary as full details.
		initialData: () => queryClient.getQueryData<MiniMovie>(["movie", movieId]),
		initialDataUpdatedAt: () =>
			queryClient.getQueryState(["movie", movieId])?.dataUpdatedAt,
	});
	if (query.data) return <MovieCard movie={query.data} />;
	return (
		<div className="relative aspect-[2/3] min-w-0 rounded-xl border border-white/10 bg-white/5">
			<div className="flex h-full flex-col items-center justify-center gap-2 p-2 text-center text-xs text-white/60">
				{query.isError ? (
					<>
						<p>Movie {movieId} is unavailable.</p>
						<button
							type="button"
							className="min-h-11 underline"
							onClick={() => void query.refetch()}
						>
							Retry movie
						</button>
					</>
				) : (
					<span className="animate-pulse">Loading movie…</span>
				)}
			</div>
			{query.isError && (
				<div className="absolute right-1 top-1">
					<SaveMovieToCollection
						category={category}
						movieId={movieId}
						title={`movie ${movieId}`}
						compact
					/>
				</div>
			)}
		</div>
	);
}

export function CollectionMovieGrid({ entries, category }: GridProps) {
	return (
		<div className={gridClass}>
			{entries.map((entry) => (
				<CollectionMovie
					key={entry.tmdb_movie_id}
					movieId={entry.tmdb_movie_id}
					category={category}
				/>
			))}
		</div>
	);
}
