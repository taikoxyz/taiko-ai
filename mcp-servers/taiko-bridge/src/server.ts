import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerReadTools } from "./tools/read-tools.js";
import { registerWriteTools } from "./tools/write-tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "taiko-bridge",
    version: "0.1.0",
  });

  registerReadTools(server);
  registerWriteTools(server);

  return server;
}
