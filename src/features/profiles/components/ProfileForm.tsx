import { useMutation } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { updateProfile } from "@/features/profiles/api/profile.functions";
import { profileInput } from "@/features/profiles/profile.schemas";

type Props = {
	userId: string;
	email: string;
	displayName: string;
	profileError: string | null;
};

export function ProfileForm({
	userId,
	email,
	displayName: initialName,
	profileError,
}: Props) {
	const router = useRouter();
	const [displayName, setDisplayName] = useState(initialName);
	const [savedName, setSavedName] = useState(initialName);
	useEffect(() => {
		setDisplayName(initialName);
		setSavedName(initialName);
	}, [initialName]);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const save = useMutation({
		mutationKey: ["private", userId, "profile", "update"],
		meta: { private: true, userId },
		mutationFn: (name: string) =>
			updateProfile({ data: { displayName: name } }),
		onSuccess: async (result) => {
			if (result.error || !result.profile) {
				setError(result.error ?? "Unable to update your profile.");
				return;
			}
			setDisplayName(result.profile.displayName);
			setSavedName(result.profile.displayName);
			setMessage("Display name saved.");
			await router.invalidate();
		},
		onError: () =>
			setError(
				"Unable to update your profile. Check your connection or sign in again.",
			),
	});
	return (
		<main className="mx-auto mt-36 sm:mt-28 max-w-lg px-4 pb-12">
			<form
				className="space-y-5 rounded-xl border border-white/15 bg-white/5 p-6 text-white"
				onSubmit={(event) => {
					event.preventDefault();
					setError("");
					setMessage("");
					const parsed = profileInput.safeParse({ displayName });
					if (!parsed.success) {
						setError(
							parsed.error.issues[0]?.message ?? "Enter a valid display name.",
						);
						return;
					}
					save.mutate(parsed.data.displayName);
				}}
			>
				<h1 className="text-2xl font-bold">Your profile</h1>
				<div>
					<p className="text-sm text-white/60">Email</p>
					<p className="break-all">{email}</p>
				</div>
				{profileError && (
					<div className="space-y-2">
						<p role="alert" className="text-sm text-amber-200">
							{profileError}
						</p>
						<button
							type="button"
							className="text-sm underline"
							onClick={() => {
								void router.invalidate();
							}}
						>
							Try again
						</button>
					</div>
				)}
				<label className="block" htmlFor="display-name">
					Display name
				</label>
				<input
					id="display-name"
					name="displayName"
					type="text"
					autoComplete="nickname"
					className="w-full rounded-lg border border-white/20 bg-black/30 p-3"
					value={displayName}
					onChange={(event) => {
						setDisplayName(event.target.value);
						setMessage("");
						setError("");
					}}
					maxLength={100}
					required
					disabled={save.isPending || Boolean(profileError)}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? "profile-error" : undefined}
				/>
				{error && (
					<p id="profile-error" role="alert" className="text-sm text-red-300">
						{error}
					</p>
				)}
				{message && (
					<output className="block text-sm text-emerald-200">{message}</output>
				)}
				<button
					type="submit"
					className="rounded-full border border-white/20 bg-white/10 px-6 py-3 transition hover:bg-white/15 disabled:opacity-50"
					disabled={
						save.isPending ||
						Boolean(profileError) ||
						displayName.trim() === savedName
					}
				>
					{save.isPending ? "Saving…" : "Save changes"}
				</button>
			</form>
		</main>
	);
}
