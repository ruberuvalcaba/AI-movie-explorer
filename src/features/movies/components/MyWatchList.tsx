import { useQueries } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "#/components/IconButton";
import { MovieSectionHeader } from "#/components/MovieSectionHeader";
import { MovieSpinner } from "#/components/MovieSpinner";
import { MovieCard } from "@/components/MovieCard";
import { movieDetailsQuery } from "../queries";
import { useWatchlistStore } from "../store/watchlistStore.store";

export function MyWatchlist() {
	const movieIds = useWatchlistStore((state) => state.movieIds);

	const movieQueries = useQueries({
		queries: movieIds.map((movieId) => movieDetailsQuery(movieId)),
	});

	const movies = movieQueries.map((query) => query.data).filter(Boolean);

	const isLoading = movieQueries.some((query) => query.isPending);

	if (isLoading) {
		return <MovieSpinner />;
	}

	return (
		<main className="mx-auto max-w-7xl my-20">
			<div className="flex items-center">
				<IconButton title="Close" icon={ChevronLeft} />
				<MovieSectionHeader title="My Watchlist" count={movies?.length} />
			</div>
			{!movieIds.length ? (
				<p>Your watchlist is empty.</p>
			) : (
				<div className="grid grid-cols-2 gap-10 md:grid-cols-5">
					{movies.map((movie) =>
						movie ? <MovieCard key={movie.id} movie={movie} /> : null,
					)}
				</div>
			)}
		</main>
	);
}
