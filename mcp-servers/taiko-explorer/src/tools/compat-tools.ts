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
    "Check if a deployed contract uses opcodes unsupported on Taiko's Shanghai EVM. " +
      "Taiko runs Shanghai (not Cancun/Prague) until the Gwyneth upgrade. " +
      "Blocked opcodes: TLOAD (0x5C), TSTORE (0x5D), MCOPY (0x5E), BLOBHASH (0x49), BLOBBASEFEE (0x4A). " +
      "Note: PUSH0 (0x5F) IS available — Shanghai added it. " +
      "Set TAIKO_EVM_VERSION=cancun|pectra to evaluate against newer fork rules. " +
      "This is the only tool of its kind for any L2 blockchain.",
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
                  ? `Contract uses ${issues.length} opcode(s) not available on Taiko's Shanghai EVM. Deployment will fail on-chain.`
                  : "Contract is compatible with Taiko's current Shanghai EVM.",
              upgradeNote:
                "Taiko will upgrade to Cancun/Pectra opcodes with the Gwyneth upgrade. After Gwyneth, these opcodes will be available.",
            }),
          },
        ],
      };
    }
  );

  // ─── check_bytecode_compatibility ──────────────────────────────────────────
  server.tool(
    "check_bytecode_compatibility",
    "Check raw EVM bytecode (hex) for opcodes unsupported on Taiko's Shanghai EVM. " +
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
                  ? `Bytecode uses ${issues.length} opcode(s) not available on Taiko's Shanghai EVM. Deployment will fail on-chain.`
                  : "Bytecode is compatible with Taiko's current Shanghai EVM.",
            }),
          },
        ],
      };
    }
  );
}
