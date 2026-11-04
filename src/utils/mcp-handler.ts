import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

export async function handleMcpRequest(
	request: Request,
	server: McpServer,
): Promise<Response> {
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	});

	try {
		await server.connect(transport);

		return await transport.handleRequest(request);
	} catch (error) {
		console.error("MCP handler error:", error);

		return Response.json(
			{
				jsonrpc: "2.0",
				error: {
					code: -32603,
					message: "Internal server error",
				},
				id: null,
			},
			{ status: 500 },
		);
	} finally {
		await Promise.allSettled([transport.close(), server.close()]);
	}
}
