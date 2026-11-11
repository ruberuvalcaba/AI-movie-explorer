import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/features/auth/auth.middleware";
import { profileInput } from "@/features/profiles/profile.schemas";
import { saveDisplayName } from "@/features/profiles/profile.server";

export const updateProfile = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(profileInput)
	.handler(({ context, data }) =>
		saveDisplayName(context.supabase, context.user.id, data.displayName),
	);
