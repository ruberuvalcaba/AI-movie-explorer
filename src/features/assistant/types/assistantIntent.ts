import { z } from "zod";

export const assistantIntentSchema = z.object({
	type: z.enum(["explain_movie", "recommend_movies"]),
	movieTitle: z.string().min(1),
	genre: z.string().min(1).optional(),
});

export type AssistantIntent = z.infer<typeof assistantIntentSchema>;
