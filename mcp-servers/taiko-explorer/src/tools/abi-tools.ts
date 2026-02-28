import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TaikoscanClient } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

export function registerAbiTools(server: McpServer): void {
  // ─── get_contract_creator ──────────────────────────────────────────────────
  server.tool(
    "get_contract_creator",
    "Get the creator address and deployment transaction for a contract on Taiko. " +
      "Returns the deployer address and the transaction hash of the contract creation.",
    {
      address: z.string().describe("Contract address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const taikoscan = new TaikoscanClient();
      const creators = await taikoscan.getContractCreator(address, network as Network);

      if (!creators || creators.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                address,
                network,
                error: "No contract creation data found. The address may not be a contract.",
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              contractCreator: creators[0]?.contractCreator,
              deployTxHash: creators[0]?.txHash,
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

  // ─── get_contract_abi ──────────────────────────────────────────────────────
  server.tool(
    "get_contract_abi",
    "Get the ABI for a verified contract on Taiko from Taikoscan. " +
      "Returns the JSON ABI array for contracts that have been source-verified.",
    {
      address: z.string().describe("Contract address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const taikoscan = new TaikoscanClient();
      const abiRaw = await taikoscan.getContractABI(address, network as Network);

      let abi: unknown;
      try {
        abi = JSON.parse(abiRaw);
      } catch {
        abi = abiRaw;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ address, network, abi }),
          },
        ],
      };
    }
  );

  // ─── get_contract_source ───────────────────────────────────────────────────
  server.tool(
    "get_contract_source",
    "Get the verified source code for a contract on Taiko from Taikoscan. " +
      "Returns source code, compiler version, and ABI for verified contracts.",
    {
      address: z.string().describe("Contract address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const taikoscan = new TaikoscanClient();
      const source = await taikoscan.getContractSource(address, network as Network);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ address, network, source }),
          },
        ],
      };
    }
  );
}
