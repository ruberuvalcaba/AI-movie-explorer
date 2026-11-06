import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Route } from "@/routes/__root";
import { signIn, signUp } from "../api/auth.functions";
import { getSafeRedirect } from "../redirect";
import { credentialsSchema, registrationSchema } from "../schemas";

export function AuthForm({
	register = false,
	redirectTo = "/",
	confirmationFailed = false,
}: {
	register?: boolean;
	redirectTo?: string;
	confirmationFailed?: boolean;
}) {
	const {
		auth: { configured },
	} = Route.useRouteContext();
	const [pending, setPending] = useState(false);
	const [message, setMessage] = useState("");
	return (
		<main className="mx-auto mt-28 max-w-md px-4">
			<form
				className="space-y-5 rounded-xl border border-white/15 bg-white/5 p-6 text-white"
				onSubmit={async (event) => {
					event.preventDefault();
					const form = new FormData(event.currentTarget);
					setPending(true);
					setMessage("");
					try {
						const input = {
							email: String(form.get("email")),
							password: String(form.get("password")),
						};
						const parsed = (
							register ? registrationSchema : credentialsSchema
						).safeParse(input);
						if (!parsed.success) {
							setMessage(
								parsed.error.issues[0]?.message ?? "Check the form fields.",
							);
							return;
						}
						const data = parsed.data;
						const result = register
							? await signUp({
									data: { ...data, redirect: getSafeRedirect(redirectTo) },
								})
							: await signIn({ data });
						if (result.error) {
							setMessage(result.error);
							return;
						}
						if (
							"confirmationRequired" in result &&
							result.confirmationRequired
						) {
							setMessage(
								"If registration was successful, check your email to confirm your account.",
							);
							return;
						}
						// A document navigation resets private client state and reloads SSR auth.
						window.location.assign(getSafeRedirect(redirectTo));
					} catch {
						setMessage("Authentication failed. Please try again.");
					} finally {
						setPending(false);
					}
				}}
			>
				<h1 className="text-2xl font-bold">
					{register ? "Create an account" : "Sign in"}
				</h1>
				{!configured && <output>Authentication is not configured yet.</output>}
				{confirmationFailed && (
					<p className="text-sm text-amber-200">
						The confirmation link is invalid or expired. Sign in if you already
						confirmed your email, or register again to request a new link.
					</p>
				)}
				<label className="block">
					Email
					<input
						className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3"
						name="email"
						type="email"
						autoComplete="email"
						required
						maxLength={254}
					/>
				</label>
				<label className="block">
					Password
					<input
						className="mt-2 w-full rounded-lg border border-white/20 bg-black/30 p-3"
						name="password"
						type="password"
						autoComplete={register ? "new-password" : "current-password"}
						minLength={register ? 8 : 1}
						maxLength={128}
						required
					/>
				</label>
				{message && (
					<output className="block text-sm text-amber-200" aria-live="polite">
						{message}
					</output>
				)}
				<button
					className="rounded-full border border-white/20 bg-white/10 px-6 py-3 disabled:opacity-50"
					disabled={pending || !configured}
					type="submit"
				>
					{pending ? "Please wait…" : register ? "Register" : "Sign in"}
				</button>
				<p className="text-sm text-white/70">
					<Link
						className="underline"
						to={register ? "/login" : "/register"}
						search={{ redirect: getSafeRedirect(redirectTo) }}
					>
						{register ? "Already registered? Sign in" : "Create an account"}
					</Link>
				</p>
			</form>
		</main>
	);
}
