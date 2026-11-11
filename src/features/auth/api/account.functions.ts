import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/features/auth/auth.middleware";
import { readProfile } from "@/features/profiles/profile.server";

export const getAccount = createServerFn({ method: "GET" })
	.middleware([requireAuth])
	.handler(async ({ context }) => ({
		id: context.user.id,
		email: context.user.email ?? "",
		...(await readProfile(context.supabase, context.user.id)),
	}));
