import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Film } from "lucide-react";
import { MovieAssistant } from "@/features/assistant/components/MovieAssistant";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "AI Movie Explorer",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="absolute flex z-50 items-center justify-center cursor-pointer">
					<div className="relative h-14 w-14">
						{/* Ambient glow */}
						<div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl" />

						{/* Outer ring */}
						<div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl" />

						{/* Spinning reel */}
						<div className="relative flex h-full w-full items-center justify-center">
							<Film size={30} strokeWidth={1.5} className="text-white/80" />
						</div>

						{/* Center glow */}
						<div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
					</div>
				</div>
				{children}
				{/* AI */}
				<MovieAssistant />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
