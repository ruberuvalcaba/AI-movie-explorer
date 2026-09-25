import { useEffect, useRef } from "react";
import { MovieCard } from "@/components/MovieCard";
import { Spinner } from "@/components/ui/spinner";
import type { Movie } from "@/types/movie";

interface MovieContainerProps {
	movies: Movie[];
	fetchNextPage: () => Promise<unknown>;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
}

export const MovieContainer = ({
	movies = [],
	fetchNextPage,
	isFetchingNextPage,
	hasNextPage,
}: MovieContainerProps) => {
	const loadMoreRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const element = loadMoreRef.current;

		if (!element) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{
				rootMargin: "0px 400px 0px 0px",
			},
		);

		observer.observe(element);

		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	return (
		<div className="relative">
			<div className="flex gap-5 overflow-x-auto px-1 pb-6 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{movies.map((movie) => (
					<div key={movie.id} className="snap-start">
						<MovieCard movie={movie} />
					</div>
				))}
				<div ref={loadMoreRef} className="h-1 w-1 shrink-0" />

				{isFetchingNextPage && (
					<div className="flex w-20 shrink-0 items-center justify-center">
						<Spinner />
					</div>
				)}
			</div>
		</div>
	);
};
