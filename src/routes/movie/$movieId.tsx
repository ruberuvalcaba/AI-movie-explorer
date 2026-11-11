import { createFileRoute } from "@tanstack/react-router";
import { MovieDetailsPage } from "@/pages/MovieDetailsPage";

export const Route = createFileRoute("/movie/$movieId")({
	component: MovieDetailsPage,
});
