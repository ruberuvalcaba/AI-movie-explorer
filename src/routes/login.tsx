import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { authSearch, getSafeRedirect } from "@/features/auth/redirect";

export const Route = createFileRoute("/login")({
	validateSearch: authSearch,
	beforeLoad: ({ context, search }) => {
		if (context.auth.user)
			throw redirect({ href: getSafeRedirect(search.redirect) });
	},
	component: Login,
});
function Login() {
	const search = Route.useSearch();
	return (
		<AuthForm
			redirectTo={search.redirect}
			confirmationFailed={search.error === "confirmation_failed"}
		/>
	);
}
