import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NETWORKS } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";
import { getBlockedOpcodes, getConfiguredEvmVersion, scanBlockedOpcodes } from "../lib/opcodes.js";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

/** Fetch deployed bytecode via eth_getCode JSON-RPC. */
async function getDeployedCode(address: string, network: Network): Promise<string> {
  const rpc = NETWORKS[network].rpc;
  const resp = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getCode",
      params: [address, "latest"],
      id: 1,
    }),
  });
  if (!resp.ok) {
    throw new Error(`RPC error ${resp.status}: ${resp.statusText}`);
  }
  const data = (await resp.json()) as { result?: string; error?: { message: string } };
  if (data.error) throw new Error(`RPC error: ${data.error.message}`);
  return data.result ?? "0x";
}

export function registerCompatTools(server: McpServer): void {
  // ─── check_taiko_compatibility ─────────────────────────────────────────────
  server.tool(
    "check_taiko_compatibility",
    "Check whether a deployed contract uses opcodes unsupported on Taiko's EVM. " +
      "Taiko and Ethereum are both on Osaka, so no opcode available on L1 is missing on L2 and " +
      "a contract that compiles for L1 deploys unchanged on L2. " +
      "Set TAIKO_EVM_VERSION=shanghai|cancun|prague to evaluate bytecode against an older fork " +
      "instead — useful for a chain that has not caught up. " +
      "Checks deployed bytecode against the configured EVM version's blocked opcode list.",
    {
      address: z.string().describe("Contract address to check (0x-prefixed)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const evmVersion = getConfiguredEvmVersion();
      const blockedOpcodes = getBlockedOpcodes(evmVersion);
      const bytecode = await getDeployedCode(address, network as Network);

      if (!bytecode || bytecode === "0x") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                address,
                network,
                error:
                  "No bytecode found at address. The account may be an EOA or the contract may not be deployed on this network.",
              }),
            },
          ],
        };
      }

      const issues = scanBlockedOpcodes(bytecode, blockedOpcodes);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              compatible: issues.length === 0,
              issues,
              bytecodeLength: (bytecode.length - 2) / 2, // bytes
              evmVersion,
              blockedOpcodes: Object.entries(blockedOpcodes).map(([hex, name]) => ({
                hex: `0x${Number(hex).toString(16).padStart(2, "0")}`,
                name,
              })),
              note:
                issues.length > 0
                  ? `Contract uses ${issues.length} opcode(s) not available on the ${evmVersion} EVM. Deployment will fail on-chain.`
                  : `Contract is compatible with the ${evmVersion} EVM.`,
              upgradeNote:
                "Taiko and Ethereum are both on Osaka, so nothing is blocked by default. Set TAIKO_EVM_VERSION to an older fork to check against a chain that lags.",
            }),
          },
        ],
      };
    }
  );

  // ─── check_bytecode_compatibility ──────────────────────────────────────────
  server.tool(
    "check_bytecode_compatibility",
    "Check raw EVM bytecode (hex) for opcodes unsupported on Taiko's EVM (Osaka by default). " +
      "Use this to check bytecode before deploying (when you have the compiled output but no on-chain address).",
    {
      bytecode: z.string().describe("Compiled contract bytecode as hex string (with or without 0x prefix)"),
    },
    async ({ bytecode }) => {
      const evmVersion = getConfiguredEvmVersion();
      const blockedOpcodes = getBlockedOpcodes(evmVersion);
      if (!bytecode || bytecode.replace(/^0x/i, "").length === 0) {
        throw new Error("bytecode must be a non-empty hex string");
      }

      const issues = scanBlockedOpcodes(bytecode, blockedOpcodes);
      const hexLen = bytecode.replace(/^0x/i, "").length;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              compatible: issues.length === 0,
              issues,
              evmVersion,
              bytecodeLength: hexLen / 2,
              note:
                issues.length > 0
                  ? `Bytecode uses ${issues.length} opcode(s) not available on the ${evmVersion} EVM. Deployment will fail on-chain.`
                  : `Bytecode is compatible with the ${evmVersion} EVM.`,
            }),
          },
        ],
      };
    }
  );
}
