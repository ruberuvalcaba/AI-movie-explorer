import { z } from "zod";

export const watchlistMovieInput = z.object({
	movieId: z
		.number()
		.int()
		.positive()
		.max(2_147_483_647, "Choose a valid movie."),
});
