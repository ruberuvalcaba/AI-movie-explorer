import { createFileRoute, redirect } from "@tanstack/react-router";
import { PasswordRecoveryForm } from "@/features/auth/components/PasswordRecoveryForm";

export const Route = createFileRoute("/reset-password")({
	beforeLoad: ({ context }) => {
		if (!context.auth.user)
			throw redirect({
				to: "/forgot-password",
				search: { error: "recovery_failed" },
			});
	},
	component: () => <PasswordRecoveryForm reset />,
});
