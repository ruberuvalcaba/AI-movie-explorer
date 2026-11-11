import { createMCPClient } from "@tanstack/ai-mcp";

export const createMovieMcpClient = () => {
	const url =
		process.env.MCP_URL ??
		(process.env.VERCEL_URL
			? `https://${process.env.VERCEL_URL}/mcp`
			: undefined);
	const token = process.env.MCP_TOKEN;

	if (!url || !token) {
		throw new Error("MCP configuration is missing");
	}

	return createMCPClient({
		transport: {
			type: "http",
			url,
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		toolFilter: (tool) =>
			["search_movies", "get_movie", "get_movie_recommendations"].includes(
				tool.name,
			),
	});
};
