import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAccount } from "@/features/auth/api/account.functions";
import { ProfileForm } from "@/features/profiles/components/ProfileForm";

export const Route = createFileRoute("/profile")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({ to: "/login", search: { redirect: "/profile" } });
	},
	loader: () => getAccount(),
	component: Profile,
});

function Profile() {
	const account = Route.useLoaderData();
	return (
		<ProfileForm
			key={account.id}
			userId={account.id}
			email={account.email}
			displayName={account.displayName}
			profileError={account.profileError}
		/>
	);
}
