import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getSafeRedirect } from "@/features/auth/redirect";
import { getSupabaseServerClient } from "@/integrations/supabase/server";

export const Route = createFileRoute("/auth/confirm")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const params = new URL(request.url).searchParams;
				const next = getSafeRedirect(params.get("next"));
				const failure = `/login?${new URLSearchParams({ error: "confirmation_failed", redirect: next })}`;
				const respond = (location: string) =>
					new Response(null, {
						status: 303,
						headers: {
							Location: location,
							"Cache-Control": "private, no-store",
							"Referrer-Policy": "no-referrer",
						},
					});
				const token = z
					.string()
					.min(1)
					.max(2048)
					.safeParse(params.get("token_hash"));
				const code = z.string().min(1).max(2048).safeParse(params.get("code"));
				const type = z
					.enum(["email", "signup"])
					.safeParse(params.get("type") ?? "email");
				if (
					params.has("error") ||
					!type.success ||
					token.success === code.success
				)
					return respond(failure);
				try {
					const supabase = getSupabaseServerClient();
					const { data, error } = token.success
						? await supabase.auth.verifyOtp({
								token_hash: token.data,
								type: type.data,
							})
						: await supabase.auth.exchangeCodeForSession(code.data as string);
					return respond(error || !data.session ? failure : next);
				} catch {
					return respond(failure);
				}
			},
		},
	},
});
