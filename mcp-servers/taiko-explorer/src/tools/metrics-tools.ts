import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BlockscoutClient } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

export function registerMetricsTools(server: McpServer): void {
  // ─── get_contract_metrics ──────────────────────────────────────────────────
  server.tool(
    "get_contract_metrics",
    "Get usage metrics for a contract or address on Taiko. " +
      "Returns transaction count, token transfer count, gas usage, and block validation count from Blockscout v2.",
    {
      address: z.string().describe("Contract or wallet address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const blockscout = new BlockscoutClient();
      const counters = await blockscout.getAddressCounters(address, network as Network);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              metrics: {
                transactionCount: counters.transactions_count,
                tokenTransferCount: counters.token_transfers_count,
                gasUsed: counters.gas_usage_count,
                validationCount: counters.validations_count,
              },
              explorerUrl:
                network === "mainnet"
                  ? `https://taikoscan.io/address/${address}`
                  : `https://hoodi.taikoscan.io/address/${address}`,
            }),
          },
        ],
      };
    }
  );

  // ─── get_similar_contracts ─────────────────────────────────────────────────
  server.tool(
    "get_similar_contracts",
    "Find contracts with similar bytecode on Taiko. " +
      "Uses Blockscout v2 to find contracts with the same bytecode hash. " +
      "Note: This endpoint may not be available on all Taiko Blockscout instances.",
    {
      address: z.string().describe("Contract address to find similar contracts for (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const blockscout = new BlockscoutClient();

      try {
        const similar = await blockscout.getSimilarContracts(address, network as Network);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ address, network, similar }),
            },
          ],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        // The /smart-contracts/{addr}/similar endpoint may not be available on Taiko's Blockscout
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                address,
                network,
                error: "Similar contracts endpoint not available on this Blockscout instance.",
                detail: message,
                suggestion: "Try searching Taikoscan directly for contracts with the same verified source code.",
              }),
            },
          ],
        };
      }
    }
  );

  // ─── get_smart_contract_info ───────────────────────────────────────────────
  server.tool(
    "get_smart_contract_info",
    "Get detailed information about a verified smart contract from Blockscout v2. " +
      "Returns name, compiler version, verification status, and ABI.",
    {
      address: z.string().describe("Contract address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const blockscout = new BlockscoutClient();
      const contract = await blockscout.getSmartContract(address, network as Network);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              name: contract.name,
              compilerVersion: contract.compiler_version,
              isVerified: contract.is_verified,
              hasSource: contract.source_code !== null,
              abi: contract.abi,
            }),
          },
        ],
      };
    }
  );
}
