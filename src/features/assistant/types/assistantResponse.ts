import { z } from "zod";

export const assistantMovieSchema = z.object({
	id: z.number(),
	title: z.string(),
	poster_path: z.string().nullable(),
	release_date: z.string(),
	vote_average: z.number(),
});

export const assistantResponseSchema = z.object({
	message: z.string(),
	movies: z.array(assistantMovieSchema),
});

export const assistantMessageSchema = z.object({
	message: z.string(),
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

/*
OUTPUT
type AssistantResponse = {
  message: string;
  movies: AssistantMovie[];
};
*/
