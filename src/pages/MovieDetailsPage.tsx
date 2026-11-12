import { useQueries } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/Badge";
import { MovieCast } from "@/features/movies/components/MovieCast";
import { MovieSpinner } from "@/features/movies/components/MovieSpinner";
import { MovieTrailer } from "@/features/movies/components/MovieTrailer";
import { MovieWatchProviders } from "@/features/movies/components/MovieWatchProviders";
import { SaveMovieToCollection } from "@/features/movies/components/SaveMovieToCollection";
import {
	movieCreditsQuery,
	movieDetailsQuery,
} from "@/features/movies/movie.queries";
import { formatRuntime } from "@/features/movies/utils/format-runtime";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w1280";

export const MovieDetailsPage = () => {
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
	const directors =
		cast?.crew.filter((member) => member.job === "Director") ?? [];

	//TanStack Query's dependent-query pattern
	/*
	const movieIdFromDetails = movie?.id;
	const creditsQuery = useQuery({
		...movieCreditsQuery(movieIdFromDetails || 0),
		enabled: !!movieIdFromDetails,
	});
	const cast = creditsQuery.data?.cast ?? [];
	*/

	if (isPending) return <MovieSpinner />;
	if (error) return <p>Failed to load movies: {error.message}</p>;

	return (
		<div className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-[#050507] text-white">
			{/* Backdrop fades into the scrolling content background. */}
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-[85svh] min-h-[560px] max-h-[960px] overflow-hidden"
				aria-hidden="true"
			>
				{movie.backdrop_path && (
					<img
						src={`${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`}
						alt=""
						className="h-full w-full object-cover"
					/>
				)}
				<div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,5,7,0.1)_0%,rgba(5,5,7,0.35)_25%,rgba(5,5,7,0.88)_70%,#050507_65%)]" />
				<div className="absolute inset-0 bg-gradient-to-r from-[#050507]/90 via-[#050507]/20 to-[#050507]/10" />
			</div>

			{/* Content */}
			<div className="relative z-10 mx-auto min-h-dvh max-w-[1400px] items-end px-4 pb-24 pt-[30svh] sm:px-6 sm:pb-16 sm:pt-[34svh]">
				<div className="mx-auto flex items-end sm:px-10">
					<div className="grid w-full min-w-0 gap-6 sm:gap-8 lg:grid-cols-[260px_1fr]">
						{/* Poster */}
						<div className="hidden overflow-hidden rounded-[12px] border border-white/15 shadow-2xl lg:block">
							<img
								src={`${TMDB_IMAGE_BASE_URL}${movie.poster_path}`}
								alt={movie.title}
								className="aspect-[2/3] h-full w-full object-cover"
							/>
						</div>

						{/* Details */}
						<div className="min-w-0 max-w-3xl">
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
							<h1 className="break-words text-3xl font-bold tracking-tight sm:text-6xl">
								{movie.title}
							</h1>

							{/* Tagline */}
							{movie.tagline && (
								<p className="mt-3 text-lg italic text-white/50">
									{movie.tagline}
								</p>
							)}

							{directors.length > 0 && (
								<p className="mt-4 text-sm text-white/60">
									Directed by{" "}
									<span className="font-medium text-white">
										{directors.map((director) => director.name).join(", ")}
									</span>
								</p>
							)}

							{/* Overview */}
							<p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
								{movie.overview}
							</p>

							{/* Actions */}
							<div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
								<MovieTrailer
									key={movie.id}
									movieTitle={movie.title}
									videos={movie.videos?.results ?? []}
								/>

								<SaveMovieToCollection
									category="watchlist"
									movieId={movie.id}
								/>
								<SaveMovieToCollection
									category="favorites"
									movieId={movie.id}
								/>
							</div>

							{/* Bottom info */}
							<div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
								<Badge
									label={formatRuntime(movie.runtime ?? 0)}
									icon={<Clock size={15} />}
								/>
								{movie.genres.map((genre) => (
									<Badge key={genre.id} label={genre.name} />
								))}
							</div>
						</div>
					</div>
				</div>
				<MovieWatchProviders
					key={movie.id}
					watchProviders={movie["watch/providers"]}
				/>
				<MovieCast cast={cast?.cast ?? []} isLoading={isCreditsPending} />
			</div>
		</div>
	);
};
