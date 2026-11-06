import { QueryClient } from "@tanstack/react-query";

export function getContext() {
	const queryClient = new QueryClient();

	return {
		queryClient,
		auth: { user: null, configured: false } as Awaited<
			ReturnType<
				typeof import("@/features/auth/api/auth.functions").getAuthStatus
			>
		>,
	};
}
export default function TanstackQueryProvider() {}
