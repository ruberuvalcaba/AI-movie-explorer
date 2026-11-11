import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { MovieCard } from "@/features/movies/components/MovieCard";
import type { Movie } from "@/features/movies/movie.types";

interface MovieRailProps {
	movies: Movie[];
	fetchNextPage: () => Promise<unknown>;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
}
const CARD_WIDTH = 250;
const GAP = 20;

export const MovieRail = ({
	movies = [],
	fetchNextPage,
	isFetchingNextPage,
	hasNextPage,
}: MovieRailProps) => {
	// const loadMoreRef = useRef<HTMLDivElement>(null); //If using infinit srolling with IntersectionObserver
	const scrollRef = useRef<HTMLDivElement>(null);
	const [cardWidth, setCardWidth] = useState(CARD_WIDTH);
	const cardHeight = cardWidth * 1.5;
	const gap = cardWidth < CARD_WIDTH ? 8 : GAP;
	const itemSize = cardWidth + gap;

	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		const updateCardWidth = () => {
			// Fit three cards, two 8px gaps, and the scroll container padding on mobile.
			setCardWidth(
				window.innerWidth < 640
					? Math.min(CARD_WIDTH, (element.clientWidth - 8 - 16) / 3)
					: CARD_WIDTH,
			);
		};
		const observer = new ResizeObserver(updateCardWidth);
		observer.observe(element);
		updateCardWidth();
		return () => observer.disconnect();
	}, []);

	/* Infinit right scrolling with IntersectionObserver */
	/*
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
	*/
	const virtualizer = useVirtualizer({
		count: movies.length,
		getScrollElement: () => scrollRef.current,
		horizontal: true,
		estimateSize: () => itemSize,
		overscan: 5, //This means TanStack Virtual renders the items visible in the viewport + approximately 5 additional items on each side.
		getItemKey: (index) => movies[index]?.id ?? index,
	});

	useEffect(() => {
		// Discard cached positions when responsive card dimensions change.
		if (itemSize > 0) virtualizer.measure();
	}, [itemSize, virtualizer]);

	const virtualItems = virtualizer.getVirtualItems();
	const lastVirtualItemIndex = virtualItems[virtualItems.length - 1]?.index;
	// Fetch the next page when the virtualized range gets close to the end of the currently loaded movies.
	useEffect(() => {
		if (lastVirtualItemIndex === undefined) return;

		const threshold = 5;

		const isNearEnd = lastVirtualItemIndex >= movies.length - threshold;

		if (isNearEnd && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [
		lastVirtualItemIndex,
		movies.length,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	]);

	return (
		<div className="relative">
			<div
				ref={scrollRef}
				className="flex gap-5 overflow-x-auto px-1 pb-6 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{/* Virtual track */}
				<div
					className="relative shrink-0"
					style={{
						width: virtualizer.getTotalSize(),
						height: cardHeight,
					}}
				>
					{virtualItems.map((virtualItem) => {
						const movie = movies[virtualItem.index];

						return (
							<div
								key={virtualItem.key}
								className="absolute top-0 snap-start"
								style={{
									left: virtualItem.start,
									width: cardWidth,
									height: cardHeight,
								}}
							>
								<MovieCard movie={movie} />
							</div>
						);
					})}
				</div>
				{/* {movies.map((movie) => (
					<div key={movie.id} className="snap-start">
						<MovieCard movie={movie} />
					</div>
				))} */}
				{/* <div ref={loadMoreRef} className="h-1 w-1 shrink-0" /> If using infinit srolling with IntersectionObserver */}

				{isFetchingNextPage && (
					<div className="flex w-20 shrink-0 items-center justify-center">
						<Spinner />
					</div>
				)}
			</div>
		</div>
	);
};
