import { z } from "zod";

export const profileInput = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Enter a display name.")
		.max(100, "Display name must be 100 characters or fewer."),
});
