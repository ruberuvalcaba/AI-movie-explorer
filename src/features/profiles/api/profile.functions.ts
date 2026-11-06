import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/features/auth/middleware";
import { profileInput } from "../schemas";
import { saveDisplayName } from "../services.server";

export const updateProfile = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(profileInput)
	.handler(({ context, data }) =>
		saveDisplayName(context.supabase, context.user.id, data.displayName),
	);
