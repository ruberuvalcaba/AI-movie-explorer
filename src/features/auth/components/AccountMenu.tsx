import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Edit, EllipsisVertical, LogOut } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/integrations/supabase/client";
import { clearPrivateCache } from "@/integrations/tanstack-query/private-cache";
import { Route } from "@/routes/__root";
import { signOut } from "../api/auth.functions";
import { getSafeRedirect } from "../redirect";

export function AccountMenu() {
	const { auth } = Route.useRouteContext();
	const router = useRouter();
	const currentPage = useLocation({ select: (location) => location.href });
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
			<Link
				to="/login"
				search={{ redirect: getSafeRedirect(currentPage) }}
				className="action-button rounded-full px-3 py-2 shrink-0 text-sm text-white"
			>
				Sign in
			</Link>
		);
	const accountLabel = auth.user.displayName || auth.user.email;
	return (
		<div className="flex shrink-0 items-center gap-3 text-sm text-white">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<button
						type="button"
						aria-label="Account options"
						title="Account options"
						disabled={pending}
						className="flex cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
					>
						<EllipsisVertical size={18} aria-hidden="true" />
					</button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="end"
						sideOffset={8}
						className="z-[100] min-w-40 rounded-xl border border-white/15 bg-[#111116] p-1 text-sm text-white shadow-2xl"
					>
						<DropdownMenu.Item
							disabled={pending}
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
							onSelect={(event) => {
								event.preventDefault();
								router.navigate({
									to: "/profile",
									search: { redirect: getSafeRedirect(currentPage) },
								});
							}}
						>
							<Edit size={16} aria-hidden="true" />
							{accountLabel}
						</DropdownMenu.Item>
						<DropdownMenu.Item
							disabled={pending}
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 outline-none data-[highlighted]:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
							onSelect={async (event) => {
								event.preventDefault();
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
							<LogOut size={16} aria-hidden="true" />
							{pending ? "Signing out…" : "Sign out"}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
			{error && <span role="alert">{error}</span>}
		</div>
	);
}
