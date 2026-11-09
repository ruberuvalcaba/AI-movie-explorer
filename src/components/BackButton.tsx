import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
	const router = useRouter();
	const navigate = useNavigate();
	const canGoBack = useCanGoBack();

	return (
		<button
			type="button"
			aria-label="Go back"
			title="Go back"
			onClick={() => {
				if (canGoBack) router.history.back();
				else void navigate({ to: "/" });
			}}
			className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-zinc-950/85 text-white shadow-lg backdrop-blur-md transition hover:border-purple-300/50 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
		>
			<ChevronLeft size={22} aria-hidden="true" />
		</button>
	);
}
