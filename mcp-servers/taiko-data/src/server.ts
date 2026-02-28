import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TaikoscanClient, BlockscoutClient, RelayerClient } from "@taikoxyz/taiko-api-client";
import { registerBaseTools } from "./tools/base-tools.js";
import { registerTaikoTools } from "./tools/taiko-tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "taiko-data",
    version: "0.1.0",
  });

  const apiKey = process.env.TAIKOSCAN_API_KEY ?? "";
  const taikoscan = new TaikoscanClient(apiKey);
  const blockscout = new BlockscoutClient();
  const relayer = new RelayerClient();

  registerBaseTools(server, taikoscan);
  registerTaikoTools(server, taikoscan, blockscout, relayer);

  return server;
}
