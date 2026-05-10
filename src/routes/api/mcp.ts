import { createFileRoute } from "@tanstack/react-router";
import { createMcpServer, withMcpAuth } from "mcp-tanstack-start";
import {
  listFoodEntriesTool,
  getDailySummaryTool,
  getBodyStatsTool,
} from "@/lib/mcp/tools/food";

const mcp = createMcpServer({
  name: "zyrafit-mcp",
  version: "1.0.0",
  instructions:
    "Tools to read the signed-in ZyraFit user's nutrition log and body composition. Authenticate by passing the user's Supabase access token as a Bearer token.",
  tools: [listFoodEntriesTool, getDailySummaryTool, getBodyStatsTool],
});

const handler = withMcpAuth(
  async (request, auth) => mcp.handleRequest(request, { auth }),
  async (request) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return null;
    return { token };
  },
);

export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      DELETE: async ({ request }) => handler(request),
    },
  },
});
