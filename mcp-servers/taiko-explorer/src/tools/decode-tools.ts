import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { keccak_256 } from "@noble/hashes/sha3";
import { TaikoscanClient, truncateHex } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";
import { lookupSignature } from "../lib/signatures.js";

/** Compute the 4-byte function selector from a canonical signature like "transfer(address,uint256)". */
function computeFunctionSelector(signature: string): string {
  const hash = keccak_256(new TextEncoder().encode(signature));
  return "0x" + Buffer.from(hash.slice(0, 4)).toString("hex");
}

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

/**
 * Decode calldata using an ABI definition.
 * Returns function name + raw argument hex slices if decoding fails.
 */
function decodeWithSignature(calldata: string, signature: string): Record<string, unknown> {
  // Signature format: "transfer(address,uint256)"
  const parenIdx = signature.indexOf("(");
  const funcName = parenIdx >= 0 ? signature.slice(0, parenIdx) : signature;
  const rawArgs = calldata.slice(10); // remove 0x + 4-byte selector

  // Slice args into 32-byte chunks for display, capped for token efficiency
  const MAX_ARG_CHUNKS = 8;
  const allChunks: string[] = [];
  for (let i = 0; i < rawArgs.length; i += 64) {
    allChunks.push("0x" + rawArgs.slice(i, i + 64));
  }
  const argChunks = allChunks.slice(0, MAX_ARG_CHUNKS);

  return {
    function: funcName,
    signature,
    selector: calldata.slice(0, 10),
    rawArgs: truncateHex("0x" + rawArgs, 512).slice(2), // truncate then remove "0x" prefix
    argChunks,
    ...(allChunks.length > MAX_ARG_CHUNKS ? { argChunksTotal: allChunks.length } : {}),
    note: "Argument values shown as raw 32-byte hex. Use a full ABI decoder for typed values.",
  };
}

export function registerDecodeTools(server: McpServer): void {
  // ─── decode_calldata ────────────────────────────────────────────────────────
  server.tool(
    "decode_calldata",
    "Decode transaction calldata to a human-readable function name and arguments. " +
      "Priority: (1) ABI lookup on Taikoscan if address is provided, " +
      "(2) openchain.xyz signature database, " +
      "(3) 4byte.directory fallback, " +
      "(4) raw hex with selector.",
    {
      calldata: z.string().describe("Hex calldata starting with 0x (at least 10 chars for the selector)"),
      address: z.string().optional().describe("Contract address for ABI-based decoding (most accurate)"),
      network: networkParam,
    },
    async ({ calldata, address, network }) => {
      if (!calldata.startsWith("0x") || calldata.length < 10) {
        throw new Error("calldata must start with 0x and include at least a 4-byte selector (10 hex chars)");
      }

      const selector = calldata.slice(0, 10).toLowerCase();

      // 1. ABI-based decode via Taikoscan (most accurate)
      if (address) {
        try {
          const taikoscan = new TaikoscanClient();
          const abiRaw = await taikoscan.getContractABI(address, network as Network);
          const abi = JSON.parse(abiRaw) as Array<{
            type: string;
            name?: string;
            inputs?: Array<{ name: string; type: string }>;
          }>;

          // Find matching function by keccak256 selector comparison
          const functions = abi.filter((item) => item.type === "function" && item.name);
          for (const fn of functions) {
            if (!fn.name) continue;
            const sig = `${fn.name}(${fn.inputs?.map((i) => i.type).join(",") ?? ""})`;
            const computedSelector = computeFunctionSelector(sig);
            if (computedSelector !== selector) continue;
            const decoded = decodeWithSignature(calldata, sig);
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify({
                    ...decoded,
                    source: "taikoscan-abi",
                    contract: address,
                    inputs: fn.inputs,
                  }),
                },
              ],
            };
          }
        } catch {
          // Fall through to signature database
        }
      }

      // 2 & 3. Signature database lookup
      const signature = await lookupSignature(selector);
      if (signature) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                ...decodeWithSignature(calldata, signature),
                source: "signature-database",
              }),
            },
          ],
        };
      }

      // 4. Raw fallback
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              selector,
              rawArgs: calldata.slice(10),
              source: "raw",
              note: "Function signature not found in any database. Provide a contract address for ABI-based decoding.",
            }),
          },
        ],
      };
    }
  );
}
