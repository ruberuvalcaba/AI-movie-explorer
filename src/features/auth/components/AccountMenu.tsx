import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/integrations/supabase/client";
import { clearPrivateCache } from "@/integrations/tanstack-query/private-cache";
import { Route } from "@/routes/__root";
import { signOut } from "../api/auth.functions";

export function AccountMenu() {
	const { auth } = Route.useRouteContext();
	const router = useRouter();
	const queryClient = useQueryClient();
	useEffect(() => {
		if (!auth.configured) return;
		const {
			data: { subscription },
		} = getSupabaseBrowserClient().auth.onAuthStateChange((_event, session) => {
			if ((session?.user.id ?? null) !== (auth.user?.id ?? null)) {
				// Defer router work until the Supabase auth callback releases its lock.
				setTimeout(() => {
					void clearPrivateCache(queryClient).then(() => router.invalidate());
				}, 0);
			}
		});
		const refresh = () => {
			void router.invalidate();
		};
		window.addEventListener("focus", refresh);
		return () => {
			subscription.unsubscribe();
			window.removeEventListener("focus", refresh);
		};
	}, [auth.configured, auth.user?.id, router, queryClient]);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");
	if (!auth.user)
		return (
			<Link to="/login" className="shrink-0 text-sm text-white">
				Sign in
			</Link>
		);
	return (
		<div className="flex shrink-0 items-center gap-3 text-sm text-white">
			<Link to="/profile" className="max-w-32 truncate" title={auth.user.email}>
				{auth.user.email}
			</Link>
			<button
				type="button"
				disabled={pending}
				onClick={async () => {
					setPending(true);
					setError("");
					try {
						await signOut();
						await clearPrivateCache(queryClient);
						window.location.assign("/");
					} catch {
						setError("Sign out failed.");
						setPending(false);
					}
				}}
			>
				{pending ? "Signing out…" : "Sign out"}
			</button>
			{error && <span role="alert">{error}</span>}
		</div>
	);
}
