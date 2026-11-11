import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
	requestPasswordRecovery,
	resetPassword,
} from "@/features/auth/api/recovery.functions";
import {
	passwordResetSchema,
	recoveryEmailSchema,
} from "@/features/auth/auth.schemas";
import { Route } from "@/routes/__root";

export function PasswordRecoveryForm({
	reset = false,
	linkFailed = false,
}: {
	reset?: boolean;
	linkFailed?: boolean;
}) {
	const {
		auth: { configured },
	} = Route.useRouteContext();
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);
	return (
		<main className="mx-auto mt-36 max-w-md px-4 pb-12 sm:mt-28">
			<form
				className="space-y-5 rounded-xl border border-white/15 bg-white/5 p-6 text-white"
				onSubmit={async (event) => {
					event.preventDefault();
					if (pending) return;
					const form = event.currentTarget;
					const fields = Object.fromEntries(new FormData(form));
					setMessage("");
					setSuccess(false);
					setPending(true);
					try {
						let result: { error: string | null };
						if (reset) {
							const parsed = passwordResetSchema.safeParse(fields);
							if (!parsed.success) {
								setMessage(
									parsed.error.issues[0]?.message ?? "Check your password.",
								);
								return;
							}
							result = await resetPassword({ data: parsed.data });
						} else {
							const parsed = recoveryEmailSchema.safeParse(fields);
							if (!parsed.success) {
								setMessage(
									parsed.error.issues[0]?.message ?? "Enter a valid email.",
								);
								return;
							}
							result = await requestPasswordRecovery({ data: parsed.data });
						}
						if (result.error) {
							setMessage(result.error);
							return;
						}
						setSuccess(true);
						form.reset();
						setMessage(
							reset
								? "Your password has been updated."
								: "If an account exists for this email, you will receive a password recovery link. Check your inbox and spam folder.",
						);
					} catch {
						setMessage(
							reset
								? "Unable to update your password. Your session may have expired; request a new recovery link."
								: "Unable to request recovery. Please try again.",
						);
					} finally {
						setPending(false);
					}
				}}
			>
				<h1 className="text-2xl font-bold">
					{reset ? "Set a new password" : "Forgot your password?"}
				</h1>
				{!configured && <p>Authentication is not configured yet.</p>}
				{linkFailed && !success && (
					<p className="text-sm text-amber-200">
						Your recovery link is invalid, expired, or already used. Request a
						new link below.
					</p>
				)}
				{!(reset && success) && (
					<>
						{reset ? (
							<>
								<label className="block">
									New password
									<input
										name="password"
										type="password"
										autoComplete="new-password"
										minLength={8}
										maxLength={128}
										required
										disabled={pending}
										className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-base"
									/>
								</label>
								<label className="block">
									Confirm new password
									<input
										name="confirmPassword"
										type="password"
										autoComplete="new-password"
										minLength={8}
										maxLength={128}
										required
										disabled={pending}
										className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-base"
									/>
								</label>
							</>
						) : (
							<>
								<p className="text-sm text-white/70">
									Enter your account email to receive a link to reset your
									password.
								</p>
								<label className="block">
									Email
									<input
										name="email"
										type="email"
										autoComplete="email"
										maxLength={254}
										required
										disabled={pending}
										className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3 text-base"
									/>
								</label>
							</>
						)}
						<button
							type="submit"
							disabled={pending || !configured}
							className="min-h-11 rounded-full border border-white/20 bg-white/10 px-6 py-3 disabled:opacity-50"
						>
							{pending
								? "Please wait…"
								: reset
									? "Update password"
									: "Send recovery link"}
						</button>
					</>
				)}
				{message && (
					<output className="block text-sm text-amber-200" aria-live="polite">
						{message}
					</output>
				)}
				<p className="text-sm text-white/70">
					{reset && success ? (
						<Link to="/" className="underline">
							Continue to movies
						</Link>
					) : reset ? (
						<Link to="/forgot-password" className="underline">
							Request a new recovery link
						</Link>
					) : (
						<Link to="/login" className="underline">
							Back to sign in
						</Link>
					)}
				</p>
			</form>
		</main>
	);
}
