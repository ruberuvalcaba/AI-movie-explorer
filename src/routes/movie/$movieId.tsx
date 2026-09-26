import { createFileRoute } from "@tanstack/react-router";
import { MovieDetails } from "#/features/movies/components/MovieDetails";

export const Route = createFileRoute("/movie/$movieId")({
	component: MovieDetails,
});
