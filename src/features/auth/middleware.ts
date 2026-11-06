import { createMiddleware } from "@tanstack/react-start";
import { getSupabaseServerClient } from "@/integrations/supabase/server";

export const requireAuth = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const supabase = getSupabaseServerClient();
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user)
			throw new Response("Unauthorized", { status: 401 });
		return next({ context: { supabase, user: data.user } });
	},
);
