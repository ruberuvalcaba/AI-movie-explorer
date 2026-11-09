import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { MovieCard } from "@/components/MovieCard";
import { Route as RootRoute } from "@/routes/__root";
import { movieDetailsQuery } from "../queries";
import { savedMoviesQuery } from "../watchlist.queries";
import type { MovieCollection } from "../watchlist.types";
import { SaveMovieToCollection } from "./SaveMovieToCollection";

const buttonClass =
	"rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15";

export function MyCollection({ category }: { category: MovieCollection }) {
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
			key={auth.user.id}
			userId={auth.user.id}
			category={category}
		/>
	);
}

function SavedMoviesPage({
	userId,
	category,
}: {
	userId: string;
	category: MovieCollection;
}) {
	const movies = useQuery(savedMoviesQuery(userId, category));
	const movieQueries = useQueries({
		queries: (movies.data ?? []).map((entry) =>
			movieDetailsQuery(entry.tmdb_movie_id),
		),
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
				<div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
					{movies.data?.map((entry, index) => {
						const query = movieQueries[index];
						return query?.data ? (
							<MovieCard key={entry.tmdb_movie_id} movie={query.data} />
						) : (
							<div
								key={entry.tmdb_movie_id}
								className="flex min-w-0 flex-col gap-3"
							>
								<div className="flex aspect-[2/3] flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60">
									{query?.isError ? (
										<>
											<p>Movie {entry.tmdb_movie_id} is unavailable.</p>
											<button
												type="button"
												className="underline"
												onClick={() => void query.refetch()}
											>
												Retry movie
											</button>
										</>
									) : (
										<output>Loading movie…</output>
									)}
								</div>
								<SaveMovieToCollection
									category={category}
									movieId={entry.tmdb_movie_id}
									title={`movie ${entry.tmdb_movie_id}`}
								/>
							</div>
						);
					})}
				</div>
			)}
		</main>
	);
}
