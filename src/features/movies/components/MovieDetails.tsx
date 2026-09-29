import { useQueries } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, Clock, Play, Plus, Star, X } from "lucide-react";
import { MovieSpinner } from "#/components/MovieSpinner";
import { PillContainer } from "#/components/PillContainer";
import { formatRuntime } from "../../../utils";
import { useToggleWatchlist } from "../mutations";
import { movieCreditsQuery, movieDetailsQuery } from "../queries";
import { useWatchlistStore } from "../store/watchlistStore";
import { MovieCast } from "./MovieCast";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280";

export const MovieDetails = () => {
	const navigate = useNavigate();
	const { movieId } = useParams({
		from: "/movie/$movieId",
	});

	//Single query
	/*
	const {
		data: movie,
		isPending,
		error,
	} = useQuery(movieDetailsQuery(Number(movieId)));
	*/

	//TanStack Query — Parallel Queries
	const results = useQueries({
		queries: [
			movieDetailsQuery(Number(movieId)),
			movieCreditsQuery(Number(movieId)),
			// similarMoviesQuery(movieId),
		],
	});

	const [movieResults, credits] = results;
	const { data: movie, isPending, error } = movieResults;
	const { data: cast, isPending: isCreditsPending } = credits;

	//TanStack Query's dependent-query pattern
	/*
	const movieIdFromDetails = movie?.id;
	const creditsQuery = useQuery({
		...movieCreditsQuery(movieIdFromDetails || 0),
		enabled: !!movieIdFromDetails,
	});
	const cast = creditsQuery.data?.cast ?? [];
	*/
	const isInWatchlist = useWatchlistStore((state) =>
		movie ? state.hasMovie(movie.id) : false,
	);
	const toggleWatchlist = useToggleWatchlist(movie?.id);
	const isAdding =
		toggleWatchlist.isPending && toggleWatchlist.variables === "add";

	const isRemoving =
		toggleWatchlist.isPending && toggleWatchlist.variables === "remove";

	if (isPending) return <MovieSpinner />;
	if (error) return <p>Failed to load movies: {error.message}</p>;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-[#050507] text-white">
			{/* Backdrop */}
			<div className="fixed inset-0">
				<img
					src={`${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`}
					alt=""
					className="h-full w-full object-cover"
				/>

				{/* Dark cinematic treatment */}
				<div className="absolute inset-0 bg-black/60" />

				<div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-[#050507]" />

				<div className="absolute inset-0 bg-gradient-to-r from-[#050507]/90 via-transparent to-[#050507]/40" />
			</div>

			{/* Close */}
			<button
				type="button"
				onClick={() => navigate({ to: "/" })}
				className="
					fixed right-6 top-6 z-20
					flex h-11 w-11 items-center justify-center
					rounded-full
					border border-white/15
					bg-black/30
					text-white/80
					backdrop-blur-xl
					transition
					hover:bg-white/10
					hover:text-white
					cursor-pointer
				"
				aria-label="Close movie"
			>
				<X size={22} />
			</button>

			{/* Content */}
			<div className="relative z-10 mx-auto min-h-screen max-w-[1400px] items-end px-6 pb-16 pt-32">
				<div className="mx-auto flex items-end sm:px-10">
					<div className="grid w-full gap-8 lg:grid-cols-[260px_1fr]">
						{/* Poster */}
						<div className="hidden overflow-hidden rounded-[12px] border border-white/15 shadow-2xl lg:block">
							<img
								src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
								alt={movie.title}
								className="aspect-[2/3] h-full w-full object-cover"
							/>
						</div>

						{/* Details */}
						<div className="max-w-3xl">
							{/* Metadata */}
							<div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
								<span>{movie.release_date?.slice(0, 4)}</span>

								<span className="h-1 w-1 rounded-full bg-white/30" />
								<span>{movie.original_language?.toUpperCase()}</span>
								<span className="h-1 w-1 rounded-full bg-white/30" />
								<div className="flex items-center gap-1.5">
									<Star size={14} className="fill-yellow-400 text-yellow-400" />
									<span className="text-white">
										{movie.vote_average.toFixed(1)}
									</span>
								</div>

								<span className="h-1 w-1 rounded-full bg-white/30" />

								<span>{movie.vote_count.toLocaleString()} votes</span>
							</div>

							{/* Title */}
							<h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
								{movie.title}
							</h1>

							{/* Tagline */}
							{movie.tagline && (
								<p className="mt-3 text-lg italic text-white/50">
									{movie.tagline}
								</p>
							)}

							{/* Overview */}
							<p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
								{movie.overview}
							</p>

							{/* Actions */}
							<div className="mt-8 flex flex-wrap gap-3">
								<button
									type="button"
									className="
									flex items-center gap-2
									rounded-full
									bg-white
									px-6 py-3
									text-sm font-semibold
									text-black
									transition
									hover:bg-white/90
								"
								>
									<Play size={17} fill="currentColor" />
									Watch Trailer
								</button>

								<button
									type="button"
									className="
									flex items-center gap-2
									rounded-full
									border border-white/15
									bg-white/10
									px-6 py-3
									text-sm font-medium
									text-white
									backdrop-blur-xl
									transition
									hover:bg-white/15
									cursor-pointer
								"
									disabled={toggleWatchlist.isPending}
									onClick={() =>
										toggleWatchlist.mutate(isInWatchlist ? "remove" : "add")
									}
								>
									{isAdding ? (
										"Adding..."
									) : isRemoving ? (
										"Removing..."
									) : isInWatchlist ? (
										<>
											<Check size={18} />
											In Watchlist
										</>
									) : (
										<>
											<Plus size={18} />
											Add to Watchlist
										</>
									)}
								</button>
								{toggleWatchlist.isError && (
									<p className="text-xs text-red-400 self-center">
										Failed to update watchlist. Try again.
									</p>
								)}
							</div>

							{/* Bottom info */}
							<div className="mt-8 flex flex-wrap gap-3">
								<PillContainer
									label={formatRuntime(movie.runtime ?? 0)}
									icon={<Clock size={15} />}
								/>
								{movie.genres.map((genre) => (
									<PillContainer key={genre.id} label={genre.name} />
								))}
							</div>
						</div>
					</div>
				</div>
				<MovieCast cast={cast?.cast ?? []} isLoading={isCreditsPending} />
			</div>
		</div>
	);
};
