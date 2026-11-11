import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	getMovieDetails,
	getMovieRecommendations,
	searchMovieByTitle,
} from "@/features/movies/services/movie.server";
import { handleMcpRequest } from "@/mcp/mcp-handler.server";

const isAuthorized = (request: Request): boolean => {
	const token = process.env.MCP_TOKEN;
	const authorization = request.headers.get("authorization");

	if (!token || !authorization) return false;

	const expected = Buffer.from(`Bearer ${token}`);
	const received = Buffer.from(authorization);

	return (
		expected.length === received.length && timingSafeEqual(expected, received)
	);
};

const createMcpServer = () => {
	const server = new McpServer({
		name: "movie-explorer",
		version: "1.0.0",
	});

	server.registerTool(
		"search_movies",
		{
			description: "Search for movies by title using TMDB",
			inputSchema: {
				query: z.string().min(1).describe("Movie title to search for"),
			},
		},
		async ({ query }) => {
			const response = await searchMovieByTitle(query);

			const movies = response.results.slice(0, 10).map((movie) => ({
				id: movie.id,
				title: movie.title,
				poster_path: movie.poster_path,
			}));

			return {
				content: [
					{
						type: "text" as const,
						text: JSON.stringify(movies),
					},
				],
			};
		},
	);

	server.registerTool(
		"get_movie",
		{
			description: "Get movie details by TMDB movie ID",
			inputSchema: {
				movieId: z.number().int().positive().describe("TMDB movie ID"),
			},
		},
		async ({ movieId }) => {
			const movie = await getMovieDetails(movieId);

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							id: movie.id,
							title: movie.title,
							overview: movie.overview,
							release_date: movie.release_date,
							vote_average: movie.vote_average,
							poster_path: movie.poster_path,
						}),
					},
				],
			};
		},
	);

	server.registerTool(
		"get_movie_recommendations",
		{
			description:
				"Get recommended movies based on a specific movie's TMDB ID.",
			inputSchema: {
				movieId: z.number().int().positive().describe("TMDB movie ID"),
			},
		},
		async ({ movieId }) => {
			const response = await getMovieRecommendations(movieId);

			const movies = response.results.slice(0, 10).map((movie) => ({
				id: movie.id,
				title: movie.title,
				overview: movie.overview,
				poster_path: movie.poster_path,
				release_date: movie.release_date,
				vote_average: movie.vote_average,
			}));

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({ movies }),
					},
				],
			};
		},
	);

	return server;
};

export const Route = createFileRoute("/mcp")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				if (!isAuthorized(request)) {
					return new Response("Unauthorized", {
						status: 401,
						headers: {
							"WWW-Authenticate": "Bearer",
						},
					});
				}

				return handleMcpRequest(request, createMcpServer());
			},
		},
	},
});
