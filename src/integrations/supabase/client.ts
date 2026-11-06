import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function getSupabaseBrowserClient() {
	return createBrowserClient<Database>(
		import.meta.env.VITE_SUPABASE_URL,
		import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
		{
			cookieOptions: {
				sameSite: "lax",
				secure: import.meta.env.PROD,
				path: "/",
			},
		},
	);
}
