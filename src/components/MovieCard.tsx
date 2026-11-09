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
				className="block"
			>
				<div
					className={
						isMini
							? "group relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-zinc-900 shadow-lg"
							: "group relative aspect-[2/3] w-full overflow-hidden rounded-[12px] bg-zinc-900 shadow-xl"
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

					{/* Cinematic overlay */}
					<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 transition-opacity duration-300 group-hover:opacity-0" />

					{/* Glass content */}
					<div className="absolute inset-x-0 bottom-0">
						<div
							className={
								isMini
									? "relative min-h-[65px] rounded-b-lg border-x border-b border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-xl"
									: "relative flex min-h-[72px] sm:min-h-[120px] flex-col rounded-b-[12px] border-x border-b border-white/15 bg-white/10 p-1.5 sm:p-3 shadow-2xl backdrop-blur-xl"
							}
						>
							{/* Title */}
							<h3
								className={
									isMini
										? "mb-1 truncate text-xs font-bold tracking-tight text-white"
										: "mb-1 line-clamp-2 sm:line-clamp-none break-words text-[11px] sm:mb-2 sm:text-lg font-bold tracking-tight text-white"
								}
							>
								{movie.title}
							</h3>

							<div
								className={
									isMini
										? "flex items-center justify-between"
										: "mt-auto flex flex-wrap items-center justify-between gap-1"
								}
							>
								{/* Rating */}
								<div
									className={
										isMini
											? "flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md"
											: "flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-1 py-0.5 text-[10px] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs font-medium text-white backdrop-blur-md"
									}
								>
									<span className="text-yellow-400">★</span>
									<span>{movie.vote_average.toFixed(1)}</span>
								</div>

								{/* Year */}
								<div
									className={
										isMini
											? "rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/80"
											: "rounded-full border border-white/15 px-1 py-0.5 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs font-medium text-white/80"
									}
								>
									{movie.release_date?.slice(0, 4)}
								</div>
							</div>
						</div>
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
