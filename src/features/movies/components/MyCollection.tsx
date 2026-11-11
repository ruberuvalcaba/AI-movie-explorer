import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { Route as RootRoute } from "@/routes/__root";
import { savedMoviesQuery } from "../watchlist.queries";
import type { MovieCollection } from "../watchlist.types";
import { CollectionMovieGrid } from "./CollectionMovieGrid";

const buttonClass =
	"rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15";

export const MyCollection = ({ category }: { category: MovieCollection }) => {
	const { auth } = RootRoute.useRouteContext();
	if (!auth.user)
		return (
			<main className="mx-auto mt-36 sm:mt-28 max-w-7xl px-4 text-white">
				<Link
					to="/login"
					search={{ redirect: `/${category}` }}
					className="underline"
				>
					Sign in to view your {category}
				</Link>
			</main>
		);
	return (
		<SavedMoviesPage
			key={`${auth.user.id}:${category}`}
			userId={auth.user.id}
			category={category}
		/>
	);
};

const SavedMoviesPage = ({
	userId,
	category,
}: {
	userId: string;
	category: MovieCollection;
}) => {
	const movies = useQuery(savedMoviesQuery(userId, category));
	const queryClient = useQueryClient();
	// Keep the loaded portion when returning from movie details; account cleanup
	// removes this view state together with the user's other private cache entries.
	const viewKey = ["private", userId, "collectionView", category] as const;
	const { data: visibleCount } = useQuery({
		queryKey: viewKey,
		queryFn: () => 24,
		initialData: 24,
		enabled: false,
		staleTime: Infinity,
		gcTime: 30 * 60_000,
	});
	return (
		<main className="mx-auto mb-20 mt-36 sm:mt-20 max-w-7xl px-4 pb-20 text-white sm:px-6">
			<div className="flex items-center">
				<MovieSectionHeader
					title={category === "favorites" ? "My Favorites" : "My Watchlist"}
					count={movies.data?.length ?? 0}
				/>
			</div>
			{movies.isPending && (
				<output className="block py-6 text-white/60">
					Loading your {category}…
				</output>
			)}
			{movies.isError && (
				<div role="alert" className="space-y-3 py-6">
					<p>Unable to load your {category}. Please try again.</p>
					<button
						type="button"
						className={buttonClass}
						onClick={() => void movies.refetch()}
					>
						Try again
					</button>
				</div>
			)}
			{movies.isSuccess && !movies.data.length && (
				<div className="space-y-3 py-8 text-white/60">
					<p>Your {category} is empty. Save a movie to find it here later.</p>
					<Link to="/" className="text-white underline">
						Browse movies
					</Link>
				</div>
			)}
			{Boolean(movies.data?.length) && (
				<>
					<CollectionMovieGrid
						entries={(movies.data ?? []).slice(0, visibleCount)}
						category={category}
					/>
					<p className="mt-4 text-sm text-white/60" aria-live="polite">
						Showing {Math.min(visibleCount, movies.data?.length ?? 0)} of{" "}
						{movies.data?.length} movies
					</p>
					{visibleCount < (movies.data?.length ?? 0) && (
						<button
							type="button"
							className={`${buttonClass} mt-4 min-h-11`}
							onClick={() =>
								queryClient.setQueryData<number>(
									viewKey,
									(count = 24) => count + 24,
								)
							}
						>
							Load more movies
						</button>
					)}
				</>
			)}
		</main>
	);
};
