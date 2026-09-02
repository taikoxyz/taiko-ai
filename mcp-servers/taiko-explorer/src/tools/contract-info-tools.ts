import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TaikoscanClient, UNVERIFIED_ABI_SENTINEL, summarizeAbi } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

function explorerUrl(address: string, network: string): string {
  return network === "mainnet"
    ? `https://taikoscan.io/address/${address}`
    : `https://hoodi.taikoscan.io/address/${address}`;
}

export function registerContractInfoTools(server: McpServer): void {
  // ─── get_smart_contract_info ───────────────────────────────────────────────
  server.tool(
    "get_smart_contract_info",
    "Get verification details for a contract on Taiko from Taikoscan. " +
      "Returns name, compiler version, optimizer settings, EVM version, license, proxy status, " +
      "and a summarized ABI. Use get_contract_source for the full source text.",
    {
      address: z.string().describe("Contract address (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const taikoscan = new TaikoscanClient();
      const info = await taikoscan.getContractSourceInfo(address, network as Network);

      if (!info) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                address,
                network,
                error: "No contract found at this address on Taikoscan.",
                explorerUrl: explorerUrl(address, network),
              }),
            },
          ],
        };
      }

      // Taikoscan returns a row for unverified contracts too, with the ABI field carrying a
      // sentinel string rather than JSON. Treat that as "exists but unverified".
      const isVerified = info.ABI !== "" && info.ABI !== UNVERIFIED_ABI_SENTINEL;

      let abi: unknown = null;
      if (isVerified) {
        try {
          abi = summarizeAbi(JSON.parse(info.ABI));
        } catch {
          abi = null;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              isVerified,
              name: info.ContractName || null,
              compilerVersion: info.CompilerVersion || null,
              evmVersion: info.EVMVersion || null,
              optimizationUsed: info.OptimizationUsed === "1",
              optimizerRuns: info.Runs ? Number(info.Runs) : null,
              licenseType: info.LicenseType || null,
              // Etherscan-style APIs report "1" for a proxy and name the implementation.
              isProxy: info.Proxy === "1",
              implementation: info.Implementation || null,
              hasSource: Boolean(info.SourceCode),
              abi,
              explorerUrl: explorerUrl(address, network),
            }),
          },
        ],
      };
    }
  );
}
