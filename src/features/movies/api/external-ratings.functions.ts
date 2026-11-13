import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getExternalMovieRatings } from "@/features/movies/services/mdblist.server";

export const getMovieExternalRatings = createServerFn({ method: "GET" })
	.validator(
		z.object({ movieId: z.number().int().positive().max(2_147_483_647) }),
	)
	.handler(({ data }) => getExternalMovieRatings(data.movieId));
