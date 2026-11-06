import { createServerFn } from "@tanstack/react-start";
import { readProfile } from "@/features/profiles/services.server";
import { requireAuth } from "../middleware";

export const getAccount = createServerFn({ method: "GET" })
	.middleware([requireAuth])
	.handler(async ({ context }) => ({
		id: context.user.id,
		email: context.user.email ?? "",
		...(await readProfile(context.supabase, context.user.id)),
	}));
