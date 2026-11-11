import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MovieCard } from "@/features/movies/components/MovieCard";
import { MovieSectionHeader } from "@/features/movies/components/MovieSectionHeader";
import { searchMoviesQuery } from "@/features/movies/movie.queries";

export const MovieSearchResults = ({ children }: { children: ReactNode }) => {
	const { q } = useSearch({ from: "/" });
	const query = q ?? "";
	const {
		data,
		isPending,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useInfiniteQuery(searchMoviesQuery(query));
	const movies = [
		...new Map(
			data?.pages
				.flatMap((page) => page.results)
				.map((movie) => [movie.id, movie]),
		).values(),
	];

	return (
		<>
			{!query ? (
				children
			) : (
				<section
					className="px-3 py-6 pb-24 sm:px-7"
					aria-label="Movie search results"
					aria-busy={isPending || isFetchingNextPage}
				>
					<MovieSectionHeader
						title={`Results for "${query}"`}
						count={`${movies?.length} ${hasNextPage ? "+" : ""}`}
					/>
					<div aria-live="polite">
						{isPending && <p>Searching movies...</p>}
						{data && movies.length === 0 && (
							<p>No movies found. Try another title.</p>
						)}
					</div>
					<div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
						{movies.map((movie) => (
							<MovieCard key={movie.id} movie={movie} />
						))}
					</div>
					{isError && (
						<div role="alert" className="mt-4">
							<p>Could not load search results.</p>
							<button
								type="button"
								onClick={() => (data ? fetchNextPage() : refetch())}
								className="mt-2 cursor-pointer rounded-full border border-white/20 px-5 py-3"
							>
								Try again
							</button>
						</div>
					)}
					{hasNextPage && !isError && (
						<button
							type="button"
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="mt-6 cursor-pointer rounded-full border border-white/20 px-5 py-3 disabled:opacity-50"
						>
							{isFetchingNextPage ? "Loading..." : "Load more"}
						</button>
					)}
				</section>
			)}
		</>
	);
};
