import { createFileRoute, redirect } from "@tanstack/react-router";
import { AuthForm } from "@/features/auth/components/AuthForm";
import { authSearch, getSafeRedirect } from "@/features/auth/redirect";

export const Route = createFileRoute("/register")({
	validateSearch: authSearch,
	beforeLoad: ({ context, search }) => {
		if (context.auth.user)
			throw redirect({ href: getSafeRedirect(search.redirect) });
	},
	component: Register,
});
function Register() {
	const search = Route.useSearch();
	return <AuthForm register redirectTo={search.redirect} />;
}
