import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/database.types";

type Client = SupabaseClient<Database>;

export async function readProfile(supabase: Client, userId: string) {
	const { data, error } = await supabase
		.from("profiles")
		.select("display_name, avatar_url")
		.eq("id", userId)
		.maybeSingle();
	return {
		displayName: data?.display_name ?? "",
		avatarUrl: data?.avatar_url ?? null,
		profileError:
			error || !data
				? "Your profile is unavailable right now. Please try again later."
				: null,
	};
}

export async function saveDisplayName(
	supabase: Client,
	userId: string,
	displayName: string,
) {
	// The caller's verified identity supplies ownership. RLS remains an additional check.
	const { data, error } = await supabase
		.from("profiles")
		.update({ display_name: displayName })
		.eq("id", userId)
		.select("display_name")
		.maybeSingle();
	if (error || !data)
		return {
			profile: null,
			error: "Unable to save your display name. Please try again.",
		};
	return { profile: { displayName: data.display_name }, error: null };
}
