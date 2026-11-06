import { useIsMutating, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Bookmark,
	BookmarkCheck,
	CircleAlert,
	LoaderCircle,
} from "lucide-react";
import { Route as RootRoute } from "@/routes/__root";
import {
	useAddMovieToWatchlist,
	useRemoveMovieFromWatchlist,
} from "../mutations";
import { savedMoviesQuery } from "../watchlist.queries";

type Props = { movieId: number; title?: string; compact?: boolean };

const actionClass =
	"flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50";
const compactClass =
	"flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60";

export function SaveMovieToWatchlist({
	movieId,
	title,
	compact = false,
}: Props) {
	const { auth } = RootRoute.useRouteContext();
	const description = title ?? "this movie";
	if (!auth.user)
		return (
			<Link
				to="/login"
				search={{ redirect: `/movie/${movieId}` }}
				className={compact ? compactClass : actionClass}
				aria-label={`Sign in to save ${description} to your watchlist`}
				title="Sign in to save movies"
			>
				<Bookmark size={compact ? 17 : 18} aria-hidden="true" />
				{!compact && "Sign in to save a movie"}
			</Link>
		);
	return (
		<MovieWatchlistControl
			key={`${auth.user.id}:${movieId}`}
			userId={auth.user.id}
			movieId={movieId}
			compact={compact}
			title={description}
		/>
	);
}

function MovieWatchlistControl({
	userId,
	movieId,
	compact,
	title,
}: Props & { userId: string }) {
	const movies = useQuery(savedMoviesQuery(userId));
	const add = useAddMovieToWatchlist(userId);
	const remove = useRemoveMovieFromWatchlist(userId);
	const pendingMovie = (mutation: { state: { variables?: unknown } }) =>
		(mutation.state.variables as { movieId?: number } | undefined)?.movieId ===
		movieId;
	const adding =
		useIsMutating({
			mutationKey: ["private", userId, "savedMovies", "add"],
			predicate: pendingMovie,
		}) > 0;
	const removing =
		useIsMutating({
			mutationKey: ["private", userId, "savedMovies", "remove"],
			predicate: pendingMovie,
		}) > 0;
	const busy = adding || removing;
	const saved =
		movies.data?.some((entry) => entry.tmdb_movie_id === movieId) ?? false;
	const mutationFailed = add.isError || remove.isError;
	const label = movies.isError
		? "Retry loading watchlist"
		: movies.isPending
			? "Loading watchlist…"
			: removing
				? "Removing…"
				: adding
					? "Saving…"
					: saved
						? "Remove from watchlist"
						: "Add to watchlist";
	const Icon =
		movies.isPending || busy
			? LoaderCircle
			: movies.isError || mutationFailed
				? CircleAlert
				: saved
					? BookmarkCheck
					: Bookmark;
	return (
		<div className={compact ? "relative" : "space-y-2"}>
			<button
				type="button"
				className={compact ? compactClass : actionClass}
				disabled={movies.isPending || busy}
				aria-label={
					movies.isPending || busy || movies.isError
						? label
						: `${label}: ${title}`
				}
				aria-pressed={saved}
				title={
					mutationFailed ? "Unable to update watchlist. Try again." : label
				}
				onClick={() => {
					if (movies.isError) {
						void movies.refetch();
						return;
					}
					add.reset();
					remove.reset();
					saved ? remove.mutate({ movieId }) : add.mutate({ movieId });
				}}
			>
				<Icon
					size={compact ? 17 : 18}
					className={movies.isPending || busy ? "animate-spin" : undefined}
					aria-hidden="true"
				/>
				{!compact && label}
			</button>
			{(movies.isError || mutationFailed) && (
				<p
					role="alert"
					className={compact ? "sr-only" : "text-sm text-red-300"}
				>
					{movies.isError
						? "Unable to load your watchlist. Retry to check saved movies."
						: "Unable to update your watchlist. Please try again. If your session expired, sign in again."}
				</p>
			)}
		</div>
	);
}
