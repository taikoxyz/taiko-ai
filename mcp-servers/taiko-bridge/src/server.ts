import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReadTools } from "./tools/read-tools.js";
import { registerWriteTools } from "./tools/write-tools.js";

/** Create a read-only bridge MCP server (safe for hosted HTTP). */
export function createReadServer(): McpServer {
  const server = new McpServer({
    name: "taiko-bridge",
    version: "0.1.0",
  });

  registerReadTools(server);
  return server;
}

/** Create the full bridge MCP server (read + write, for local stdio use). */
export function createServer(): McpServer {
  const server = createReadServer();
  registerWriteTools(server);

  return server;
}
