import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Bookmark } from "lucide-react";
import { IconButton } from "#/components/IconButton";
import { useWatchlistStore } from "#/features/movies/store/watchlistStore.store";
import { HomeButton } from "@/components/HomeButton";
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
				{children}
				{/* ───────────────── MENU ───────────────── */}
				<div className="fixed w-full flex z-50 top-0 justify-end px-12 py-5 border-b border-white/10 backdrop-blur-xl transition-colors shadow-lg">
					<IconButton
						title="My watchlist"
						icon={Bookmark}
						count={useWatchlistStore((state) => state.movieIds.length)}
						route="/watchlist"
					/>
					<HomeButton />
				</div>
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
