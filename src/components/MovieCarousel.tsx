import { MovieCard } from "@/components/MovieCard";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import type { Movie } from "@/types/movie";

interface MovieCarouselProps {
	movies: Movie[];
}

export const MovieCarousel = ({ movies }: MovieCarouselProps) => {
	return (
		<div className="flex w-full flex-col items-center gap-4">
			<Carousel className="w-full max-w-4xl">
				<CarouselContent className="-ml-1">
					{movies.map((movie) => (
						<CarouselItem
							key={movie.id}
							className="basis-1/2 pl-1 lg:basis-1/5"
						>
							<div className="p-1">
								<Card>
									<CardContent className="flex aspect-square items-center justify-center p-6">
										<MovieCard key={movie.id} movie={movie} />
									</CardContent>
								</Card>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious />
				<CarouselNext />
			</Carousel>
		</div>
	);
};
