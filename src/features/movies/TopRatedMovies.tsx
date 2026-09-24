import { useQuery } from "@tanstack/react-query";
import { MovieCarousel } from "@/components/MovieCarousel";
import { Card, CardContent } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { MovieCard } from "../../components/MovieCard";
import { topRatedMoviesQuery } from "./queries";

export const TopRatedMovies = () => {
	const { data, isPending, error } = useQuery(topRatedMoviesQuery(1));

	if (isPending) {
		return <p>Loading movies...</p>;
	}

	if (error) {
		return <p>Failed to load movies: {error.message}</p>;
	}

	return (
		<section>
			<h1>Top Rated Movies</h1>
			<MovieCarousel movies={data.results} />
		</section>
	);
};
