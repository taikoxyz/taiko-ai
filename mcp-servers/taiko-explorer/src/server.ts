import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAbiTools } from "./tools/abi-tools.js";
import { registerDecodeTools } from "./tools/decode-tools.js";
import { registerCompatTools } from "./tools/compat-tools.js";
import { registerMetricsTools } from "./tools/metrics-tools.js";
import { registerAnalyzeTools } from "./tools/analyze-tools.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "taiko-explorer",
    version: "0.1.0",
  });

  registerAbiTools(server); // get_contract_creator, get_contract_abi, get_contract_source
  registerDecodeTools(server); // decode_calldata
  registerCompatTools(server); // check_taiko_compatibility, check_bytecode_compatibility
  registerMetricsTools(server); // get_contract_metrics, get_similar_contracts, get_smart_contract_info
  registerAnalyzeTools(server); // analyze_contract (requires Slither)

  return server;
}
