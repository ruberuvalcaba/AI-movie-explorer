import { createServerClient } from "@supabase/ssr";
import {
	getCookies,
	setCookie,
	setResponseHeader,
} from "@tanstack/react-start/server";
import type { Database } from "./database.types";

export function isAuthConfigured() {
	return Boolean(
		process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
	);
}

// Call only inside a request: authenticated clients must never be shared.
export function getSupabaseServerClient() {
	const url = process.env.VITE_SUPABASE_URL;
	const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key)
		throw new Error("Supabase authentication is not configured.");
	setResponseHeader("Cache-Control", "private, no-store");
	setResponseHeader("Vary", "Cookie");
	return createServerClient<Database>(url, key, {
		cookieOptions: {
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			path: "/",
		},
		cookies: {
			getAll: () =>
				Object.entries(getCookies()).map(([name, value]) => ({
					name,
					value,
				})),
			setAll(cookies, headers) {
				for (const { name, value, options } of cookies)
					setCookie(name, value, options);
				for (const [name, value] of Object.entries(headers))
					setResponseHeader(name, value);
			},
		},
	});
}
