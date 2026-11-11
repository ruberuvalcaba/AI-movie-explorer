import { useIsMutating, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bookmark, CircleAlert, Heart, LoaderCircle } from "lucide-react";
import { Route as RootRoute } from "@/routes/__root";
import { useAddSavedMovie, useRemoveSavedMovie } from "../mutations";
import { savedMovieKeys, savedMoviesQuery } from "../watchlist.queries";
import type { MovieCollection } from "../watchlist.types";

type Props = {
	movieId: number;
	title?: string;
	compact?: boolean;
	category: MovieCollection;
};

const actionClass =
	"action-button flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-xl transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50";
const compactClass =
	"action-button flex cursor-pointer h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-lg backdrop-blur-md transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60";

export const SaveMovieToCollection = ({
	movieId,
	title,
	compact = false,
	category,
}: Props) => {
	const { auth } = RootRoute.useRouteContext();
	const description = title ?? "this movie";
	const Icon = category === "favorites" ? Heart : Bookmark;
	if (!auth.user)
		return (
			<Link
				to="/login"
				search={{ redirect: `/movie/${movieId}` }}
				className={compact ? compactClass : actionClass}
				aria-label={`Sign in to save ${description} to your ${category}`}
				title="Sign in to save movies"
			>
				<Icon size={compact ? 17 : 18} aria-hidden="true" />
				{!compact && `Sign in to save to ${category}`}
			</Link>
		);
	return (
		<MovieCollectionControl
			key={`${auth.user.id}:${movieId}:${category}`}
			userId={auth.user.id}
			movieId={movieId}
			compact={compact}
			category={category}
			title={description}
		/>
	);
};

const MovieCollectionControl = ({
	userId,
	movieId,
	compact,
	category,
	title,
}: Props & { userId: string }) => {
	const movies = useQuery(savedMoviesQuery(userId, category));
	const add = useAddSavedMovie(userId, category);
	const remove = useRemoveSavedMovie(userId, category);
	const pendingMovie = (mutation: { state: { variables?: unknown } }) =>
		(mutation.state.variables as { movieId?: number } | undefined)?.movieId ===
		movieId;
	const adding =
		useIsMutating({
			mutationKey: [...savedMovieKeys.all(userId, category), "add"],
			predicate: pendingMovie,
		}) > 0;
	const removing =
		useIsMutating({
			mutationKey: [...savedMovieKeys.all(userId, category), "remove"],
			predicate: pendingMovie,
		}) > 0;
	const busy = adding || removing;
	const saved =
		movies.data?.some((entry) => entry.tmdb_movie_id === movieId) ?? false;
	const mutationFailed = add.isError || remove.isError;
	const label = movies.isError
		? `Retry loading ${category}`
		: movies.isPending
			? `Loading ${category}…`
			: removing
				? "Removing…"
				: adding
					? "Saving…"
					: "";
	const Icon =
		movies.isPending || busy
			? LoaderCircle
			: movies.isError || mutationFailed
				? CircleAlert
				: category === "favorites"
					? Heart
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
					mutationFailed ? `Unable to update ${category}. Try again.` : label
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
					className={
						movies.isPending || busy
							? "animate-spin"
							: saved
								? "fill-yellow-400 text-yellow-300"
								: undefined
					}
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
						? `Unable to load your ${category}. Retry to check saved movies.`
						: `Unable to update your ${category}. Please try again. If your session expired, sign in again.`}
				</p>
			)}
		</div>
	);
};
