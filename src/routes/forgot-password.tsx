import { createFileRoute } from "@tanstack/react-router";
import { PasswordRecoveryForm } from "@/features/auth/components/PasswordRecoveryForm";

export const Route = createFileRoute("/forgot-password")({
	validateSearch: (
		search: Record<string, unknown>,
	): { error?: "recovery_failed" } => ({
		error:
			search.error === "recovery_failed"
				? ("recovery_failed" as const)
				: undefined,
	}),
	component: ForgotPassword,
});

function ForgotPassword() {
	const { error } = Route.useSearch();
	return <PasswordRecoveryForm linkFailed={error === "recovery_failed"} />;
}
