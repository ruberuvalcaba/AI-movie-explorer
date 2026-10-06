import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { usePrefetchMovie } from "@/features/movies/hooks/usePrefetchMovie";
import type { MiniMovie, Movie } from "@/types/movie";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

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
		<Link
			to="/movie/$movieId"
			params={{ movieId: String(movie.id) }}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div
				className={
					isMini
						? "group relative aspect-[2/3] w-[120px] shrink-0 overflow-hidden rounded-lg bg-zinc-900 shadow-lg"
						: "group relative aspect-[2/3] w-[250px] shrink-0 overflow-hidden rounded-[12px] bg-zinc-900 shadow-xl sm:w-[250px]"
				}
			>
				{/* Background */}
				<img
					src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
					alt={movie.title}
					className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
				/>

				{/* Cinematic overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5 transition-opacity duration-300 group-hover:opacity-0" />

				{/* Glass content */}
				<div className="absolute inset-x-0 bottom-0">
					<div
						className={
							isMini
								? "relative min-h-[65px] rounded-b-lg border-x border-b border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-xl"
								: "relative flex min-h-[120px] flex-col rounded-b-[12px] border-x border-b border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl"
						}
					>
						{/* Title */}
						<h3
							className={
								isMini
									? "mb-1 truncate text-xs font-bold tracking-tight text-white"
									: "mb-2 text-lg font-bold tracking-tight text-white"
							}
						>
							{movie.title}
						</h3>

						<div
							className={
								isMini
									? "flex items-center justify-between"
									: "mt-auto flex items-center justify-between"
							}
						>
							{/* Rating */}
							<div
								className={
									isMini
										? "flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md"
										: "flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
								}
							>
								<span className="text-yellow-400">★</span>
								<span>{movie.vote_average.toFixed(1)}</span>
							</div>

							{/* Year */}
							<div
								className={
									isMini
										? "rounded-full border border-white/15 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-md"
										: "rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md"
								}
							>
								{movie.release_date?.slice(0, 4)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
});
