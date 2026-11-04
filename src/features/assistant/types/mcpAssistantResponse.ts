import { z } from "zod";

export const mcpAssistantResponseSchema = z.object({
	message: z.string(),
	selectedMovieIds: z.array(z.number().int().min(1)),
});

export type McpAssistantResponse = z.infer<typeof mcpAssistantResponseSchema>;
