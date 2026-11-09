import { z } from "zod";

export const collectionInput = z.object({
	category: z.enum(["watchlist", "favorites"]),
});

export const savedMovieInput = collectionInput.extend({
	movieId: z
		.number()
		.int()
		.positive()
		.max(2_147_483_647, "Choose a valid movie."),
});
