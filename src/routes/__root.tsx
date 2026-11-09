import { TanStackDevtools } from "@tanstack/react-devtools";
import { type QueryClient, useQuery } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Bookmark, Heart } from "lucide-react";
import { IconButton } from "#/components/IconButton";
import { MovieSearchBar } from "#/features/movies/components/MovieSearchBar";
import { HomeButton } from "@/components/HomeButton";
import { MovieAssistant } from "@/features/assistant/components/MovieAssistant";
import { getAuthStatus } from "@/features/auth/api/auth.functions";
import { AccountMenu } from "@/features/auth/components/AccountMenu";
import { savedMoviesQuery } from "@/features/movies/watchlist.queries";
import { clearPrivateCache } from "@/integrations/tanstack-query/private-cache";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	auth: Awaited<ReturnType<typeof getAuthStatus>>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async ({ context }) => {
		const auth = await getAuthStatus();
		await clearPrivateCache(context.queryClient, auth.user?.id);
		return { auth };
	},
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
	const { auth } = Route.useRouteContext();
	const savedMovies = useQuery(savedMoviesQuery(auth.user?.id));
	const favorites = useQuery(savedMoviesQuery(auth.user?.id, "favorites"));
	return (
		<html lang="en">
			<head>
				<link rel="icon" type="image/svg+xml" href="/favicon.png" />
				<HeadContent />
			</head>
			<body>
				{children}
				{/* ───────────────── MENU ───────────────── */}
				<div className="fixed w-full flex items-center gap-2 z-50 top-0 px-2 py-3 sm:gap-4 sm:px-12 border-b border-white/10 backdrop-blur-xl transition-colors shadow-lg">
					<HomeButton />
					<MovieSearchBar />
					<div className="shrink-0">
						<IconButton
							title="My watchlist"
							icon={Bookmark}
							count={auth.user ? savedMovies.data?.length : undefined}
							route="/watchlist"
						/>
					</div>
					<div className="shrink-0">
						<IconButton
							title="My favorites"
							icon={Heart}
							count={auth.user ? favorites.data?.length : undefined}
							route="/favorites"
						/>
					</div>
					<AccountMenu />
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
