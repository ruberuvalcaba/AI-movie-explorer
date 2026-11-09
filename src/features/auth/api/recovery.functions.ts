import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getSupabaseServerClient } from "@/integrations/supabase/server";
import { requireAuth } from "../middleware";
import { passwordResetSchema, recoveryEmailSchema } from "../schemas";

export const requestPasswordRecovery = createServerFn({ method: "POST" })
	.validator(recoveryEmailSchema)
	.handler(async ({ data }) => {
		const callback = new URL("/auth/confirm", getRequest().url);
		callback.searchParams.set("type", "recovery");
		try {
			const { error } =
				await getSupabaseServerClient().auth.resetPasswordForEmail(data.email, {
					redirectTo: callback.toString(),
				});
			if (error?.status === 429) {
				return { error: "Too many requests. Please wait before trying again." };
			}
			if (error && (!error.status || error.status >= 500)) {
				return {
					error: "Unable to send a recovery email right now. Please try again.",
				};
			}
			// Account-specific errors must not disclose whether this email is registered.
			return { error: null };
		} catch {
			return {
				error: "Unable to send a recovery email right now. Please try again.",
			};
		}
	});

export const resetPassword = createServerFn({ method: "POST" })
	.middleware([requireAuth])
	.validator(passwordResetSchema)
	.handler(async ({ context, data }) => {
		const { error } = await context.supabase.auth.updateUser({
			password: data.password,
		});
		if (!error) return { error: null };
		if (error.code === "weak_password")
			return { error: "Choose a stronger password and try again." };
		if (error.code === "same_password")
			return {
				error: "Choose a password different from your previous password.",
			};
		return {
			error:
				"Unable to update your password. Try again or request a new recovery link.",
		};
	});
