import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { SaveMovieToCollection } from "@/features/movies/components/SaveMovieToCollection";
import { usePrefetchMovie } from "@/features/movies/hooks/usePrefetchMovie";
import type { MiniMovie, Movie } from "@/types/movie";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";

interface MovieCardProps {
	movie: Movie;
	isMini?: false;
}

interface MiniMovieCardProps {
	movie: MiniMovie;
	isMini: true;
}

type Props = MovieCardProps | MiniMovieCardProps;

export const MovieCard = memo((props: Props) => {
	const { movie, isMini = false } = props;
	const { onMouseEnter, onMouseLeave } = usePrefetchMovie(movie.id);

	return (
		<div
			className={
				isMini ? "relative w-[120px] shrink-0" : "relative w-full min-w-0"
			}
		>
			<Link
				to="/movie/$movieId"
				params={{ movieId: String(movie.id) }}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				className="group block rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
			>
				<div
					className={
						isMini
							? "group relative aspect-[2/3] w-full overflow-hidden rounded-lg border border-white/15 bg-zinc-900 shadow-lg transition-[border-color,box-shadow] duration-300 group-hover:border-purple-300/50 group-hover:shadow-[0_0_18px_rgba(168,85,247,0.15)] group-focus-visible:border-purple-300/50"
							: "group relative aspect-[2/3] w-full overflow-hidden rounded-[12px] border border-white/15 bg-zinc-900 shadow-xl transition-[border-color,box-shadow] duration-300 group-hover:border-purple-300/50 group-hover:shadow-[0_0_18px_rgba(168,85,247,0.15)] group-focus-visible:border-purple-300/50"
					}
				>
					{/* Background */}
					<img
						src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
						alt={movie.title}
						className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
						loading="lazy"
						decoding="async"
					/>
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
					/>
					<div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 px-2 pb-2 pt-4 text-[10px] font-medium text-white/90 sm:px-3 sm:pb-3 sm:text-xs">
						<span className="flex items-center gap-1">
							<span aria-hidden="true" className="text-yellow-400">
								★
							</span>
							<span className="sr-only">Rating: </span>
							{movie.vote_average.toFixed(1)}
						</span>
						<span>{movie.release_date?.slice(0, 4)}</span>
					</div>
				</div>
			</Link>
			<div className="absolute right-1 top-1 z-10 flex gap-1 sm:right-2 sm:top-2 sm:gap-2">
				<SaveMovieToCollection
					category="watchlist"
					movieId={movie.id}
					title={movie.title}
					compact
				/>
				<SaveMovieToCollection
					category="favorites"
					movieId={movie.id}
					title={movie.title}
					compact
				/>
			</div>
		</div>
	);
});
