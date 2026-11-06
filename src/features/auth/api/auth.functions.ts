import type { AuthError } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import {
	getSupabaseServerClient,
	isAuthConfigured,
} from "@/integrations/supabase/server";
import { getSafeRedirect } from "../redirect";
import { credentialsSchema, registrationSchema } from "../schemas";

function authErrorMessage(error: AuthError, registering = false): string {
	if (
		error.status === 429 ||
		error.code === "over_request_rate_limit" ||
		error.code === "over_email_send_rate_limit"
	) {
		return "Too many attempts. Please wait a moment before trying again.";
	}
	if (error.code === "weak_password")
		return "Choose a stronger password and try again.";
	if (
		error.code === "signup_disabled" ||
		error.code === "email_provider_disabled"
	)
		return "Email registration is currently unavailable.";
	if (error.status && error.status >= 500)
		return "Authentication is temporarily unavailable. Please try again.";
	return registering
		? "Unable to create an account. If you already registered, sign in or check your email."
		: "Unable to sign in. Check your credentials and confirm your email.";
}

export const getAuthStatus = createServerFn({ method: "GET" }).handler(
	async () => {
		if (!isAuthConfigured()) return { user: null, configured: false };
		const { data, error } = await getSupabaseServerClient().auth.getUser();
		return {
			user:
				error || !data.user
					? null
					: { id: data.user.id, email: data.user.email ?? "" },
			configured: true,
		};
	},
);

export const signIn = createServerFn({ method: "POST" })
	.validator(credentialsSchema)
	.handler(async ({ data }) => {
		const { error } =
			await getSupabaseServerClient().auth.signInWithPassword(data);
		return {
			error: error ? authErrorMessage(error) : null,
		};
	});

export const signUp = createServerFn({ method: "POST" })
	.validator(registrationSchema)
	.handler(async ({ data }) => {
		const confirmationUrl = new URL("/auth/confirm", getRequest().url);
		confirmationUrl.searchParams.set("next", getSafeRedirect(data.redirect));
		const { data: result, error } = await getSupabaseServerClient().auth.signUp(
			{
				email: data.email,
				password: data.password,
				options: { emailRedirectTo: confirmationUrl.toString() },
			},
		);
		return {
			error: error ? authErrorMessage(error, true) : null,
			confirmationRequired: !result.session,
		};
	});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
	const { error } = await getSupabaseServerClient().auth.signOut({
		scope: "local",
	});
	if (error) throw new Error("Unable to sign out. Please try again.");
});
