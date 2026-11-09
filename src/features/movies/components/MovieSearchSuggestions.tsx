import { Link } from "@tanstack/react-router";
import type { MiniMovie } from "#/types/movie";

interface MovieSearchSuggestionsProps {
	movies: MiniMovie[];
	isLoading: boolean;
	isError: boolean;
	onSelect: () => void;
}

export const MovieSearchSuggestions = ({
	movies,
	isLoading,
	isError,
	onSelect,
}: MovieSearchSuggestionsProps) => (
	<div
		id="movie-search-suggestions"
		className="absolute inset-x-0 top-full z-10 mt-2 max-h-[min(28rem,50dvh)] touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-zinc-950 text-white shadow-xl"
	>
		{isLoading ? (
			<p aria-live="polite" className="px-4 py-3 text-sm text-white/60">
				Searching movies...
			</p>
		) : isError ? (
			<p aria-live="polite" className="px-4 py-3 text-sm text-white/60">
				Could not load suggestions. Use Search to try again.
			</p>
		) : movies.length === 0 ? (
			<p aria-live="polite" className="px-4 py-3 text-sm text-white/60">
				No movies found. Try another title.
			</p>
		) : (
			<ul aria-label="Movie suggestions">
				{movies.map((movie) => (
					<li key={movie.id}>
						<Link
							to="/movie/$movieId"
							params={{ movieId: String(movie.id) }}
							onClick={onSelect}
							className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
						>
							{movie.poster_path ? (
								<img
									src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
									alt=""
									width={40}
									height={60}
									className="h-15 w-10 shrink-0 rounded object-cover"
									loading="lazy"
								/>
							) : (
								<span className="flex h-15 w-10 shrink-0 items-center justify-center rounded bg-white/10 text-center text-[10px] text-white/50">
									No poster
								</span>
							)}
							<span className="min-w-0 flex-1">
								<span className="block break-words">{movie.title}</span>
								<span className="text-sm text-white/60">
									{movie.release_date?.slice(0, 4)}
								</span>
							</span>
							<span className="shrink-0 text-sm text-white/80">
								<span aria-hidden="true" className="text-yellow-400">
									★
								</span>{" "}
								<span className="sr-only">Rating: </span>
								{movie.vote_average.toFixed(1)}
								<span className="sr-only"> out of 10</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
		)}
	</div>
);
