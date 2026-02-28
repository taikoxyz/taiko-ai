import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  BlockscoutClient,
  NETWORKS,
  RelayerClient,
  normalizeRelayerPageInfo,
  statusToString,
} from "@taikoxyz/taiko-api-client";
import { IBridgeABI } from "../lib/abis.js";
import { BRIDGE_CONTRACTS, type TaikoNetwork } from "../networks.js";
import { makePublicClient, resolveBridgeAddress } from "../lib/clients.js";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

/** Fetch processing fee recommendations from the relayer for a given network. */
async function fetchRecommendedFees(network: TaikoNetwork) {
  const relayerBase = NETWORKS[network].relayer;
  const resp = await fetch(`${relayerBase}/recommendedProcessingFees`);
  if (!resp.ok) {
    throw new Error(`Relayer fee API returned ${resp.status}: ${await resp.text()}`);
  }
  return resp.json() as Promise<{
    fees: Array<{
      type: string;
      amount: string;
      destChainID: number;
      gasLimit: string;
    }>;
  }>;
}

export function registerReadTools(server: McpServer): void {
  // ─── get_message_status ────────────────────────────────────────────────────
  server.tool(
    "get_message_status",
    "Get the current relay status of a bridge message by its hash. " +
      "Returns NEW / RETRIABLE / DONE / FAILED / RECALLED. " +
      "Queries the relayer API first; falls back to on-chain IBridge.messageStatus.",
    {
      msgHash: z.string().describe("The 0x-prefixed bytes32 message hash from the bridge transaction"),
      network: networkParam,
      chain: z
        .enum(["l1", "l2"])
        .default("l2")
        .describe("Which chain to query on-chain status — l1 for L2→L1 messages, l2 for L1→L2 (default: l2)"),
    },
    async ({ msgHash, network, chain }) => {
      const net = network as TaikoNetwork;
      const relayer = new RelayerClient();

      // 1. Try relayer API
      try {
        const details = await relayer.getMessageStatusDetails(msgHash, net);
        if (details) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  msgHash,
                  status: details.status,
                  statusCode: details.statusCode,
                  source: "relayer",
                }),
              },
            ],
          };
        }
      } catch {
        // Fall through to on-chain
      }

      // 2. On-chain fallback
      const direction = chain === "l1" ? ("L2_TO_L1" as const) : ("L1_TO_L2" as const);
      const bridgeAddress = resolveBridgeAddress(net, direction);
      const bridgeChain = chain === "l1" ? BRIDGE_CONTRACTS[net].l1Chain : BRIDGE_CONTRACTS[net].l2Chain;
      const publicClient = makePublicClient(bridgeChain);

      const statusCode = await publicClient.readContract({
        address: bridgeAddress,
        abi: IBridgeABI,
        functionName: "messageStatus",
        args: [msgHash as `0x${string}`],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              msgHash,
              status: statusToString(Number(statusCode)),
              statusCode: Number(statusCode),
              source: "on-chain",
            }),
          },
        ],
      };
    }
  );

  // ─── get_bridge_history ────────────────────────────────────────────────────
  server.tool(
    "get_bridge_history",
    "Get historical bridge messages for an address. Returns both sent and received messages from the relayer.",
    {
      address: z.string().describe("Ethereum address (0x-prefixed)"),
      network: networkParam,
      page: z.number().int().min(1).default(1).describe("Page number"),
      size: z.number().int().min(1).max(100).default(20).describe("Results per page"),
    },
    async ({ address, network, page, size }) => {
      const net = network as TaikoNetwork;
      const relayer = new RelayerClient();
      const events = await relayer.getEvents(address, net, page, Math.min(size, 100));
      const pageInfo = normalizeRelayerPageInfo(events);
      const items = (events.items ?? []).map((e) => ({
        msgHash: e.msgHash,
        status: e.status,
        amount: e.amount,
        destChainID: e.destChainID,
        srcChainID: e.chainID,
        createdAt: e.createdAt,
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              address,
              network,
              page,
              items,
              count: items.length,
              first: pageInfo.first,
              last: pageInfo.last,
              total_pages: pageInfo.totalPages,
              visible: pageInfo.visible,
            }),
          },
        ],
      };
    }
  );

  // ─── get_pending_messages ──────────────────────────────────────────────────
  server.tool(
    "get_pending_messages",
    "Get bridge messages for an address that are awaiting relay (status: NEW or RETRIABLE).",
    {
      address: z.string().describe("Ethereum address (0x-prefixed)"),
      network: networkParam,
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum pending messages to return"),
    },
    async ({ address, network, limit }) => {
      const net = network as TaikoNetwork;
      const relayer = new RelayerClient();
      const events = await relayer.getEvents(address, net, 1, Math.min(limit, 100));

      // Filter to pending (NEW=0, RETRIABLE=1) and summarize
      const pending = (events.items?.filter((e) => e.status === 0 || e.status === 1) ?? [])
        .slice(0, limit)
        .map((e) => ({
          msgHash: e.msgHash,
          status: e.status === 0 ? "NEW" : "RETRIABLE",
          amount: e.amount,
          destChainID: e.destChainID,
          srcChainID: e.chainID,
          createdAt: e.createdAt,
        }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ pending, total: pending.length }),
          },
        ],
      };
    }
  );

  // ─── estimate_bridge_fee ───────────────────────────────────────────────────
  server.tool(
    "estimate_bridge_fee",
    "Get the recommended relayer processing fee for a bridge operation. " +
      "Returns fees in wei and ETH for ETH, ERC20 (deployed), and ERC20 (not yet deployed on dest) transfer types.",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const net = network as TaikoNetwork;
      const feeData = await fetchRecommendedFees(net);

      const formatted = feeData.fees.map((f) => ({
        type: f.type,
        feeWei: f.amount,
        feeETH:
          (BigInt(f.amount) / 10n ** 18n).toString() +
          "." +
          String(BigInt(f.amount) % 10n ** 18n)
            .padStart(18, "0")
            .slice(0, 6),
        destChainID: f.destChainID,
        gasLimit: f.gasLimit,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ network: net, fees: formatted }),
          },
        ],
      };
    }
  );

  // ─── list_supported_tokens ─────────────────────────────────────────────────
  server.tool(
    "list_supported_tokens",
    "List well-known tokens that can be bridged between L1 and Taiko L2. " +
      "Returns known token mappings with concrete addresses; unknown L1 mappings are returned as null.",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const blockscout = new BlockscoutClient();

      const l1BySymbol: Record<string, string | null> =
        network === "mainnet"
          ? {
              TAIKO: "0x10dea67478c5F8C5E2D90e5E9B26dBe60c54d800",
              USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
              WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            }
          : {
              // Hoodi token contracts vary by deployment. Unknown L1 addresses are returned as null.
              TAIKO: null,
              USDC: null,
              WETH: null,
            };

      const defaultL2BySymbol: Record<string, string | null> =
        network === "mainnet"
          ? {
              TAIKO: "0xA9d23408b9bA935c230493c40C73824Df71A0975",
              USDC: "0x07d83526730c7438048D55A4fc0b850e2aaB6f0b",
              WETH: "0xA51894664A773981C6C112C43ce576f315d5b1B6",
            }
          : {
              TAIKO: null,
              USDC: "0xf501925c8FE6c5B2FC8faD86b8C9acb2596f3295",
              WETH: "0x3B39685B5495359c892DDD1057B5712F49976835",
            };

      const tokenBySymbol = new Map<
        string,
        {
          symbol: string;
          name: string;
          type: "native" | "ERC20";
          l1Address: string | null;
          l2Address: string;
        }
      >();

      tokenBySymbol.set("ETH", {
        symbol: "ETH",
        name: "Ether",
        type: "native",
        l1Address: "native",
        l2Address: "native",
      });

      for (const symbol of ["TAIKO", "USDC", "WETH"] as const) {
        const l2Address = defaultL2BySymbol[symbol];
        if (!l2Address) continue;
        tokenBySymbol.set(symbol, {
          symbol,
          name: symbol,
          type: "ERC20",
          l1Address: l1BySymbol[symbol] ?? null,
          l2Address,
        });
      }

      try {
        const candidates = await blockscout.getTokens(network as TaikoNetwork, { type: "ERC-20" });
        for (const item of candidates.items) {
          if (!item.symbol || !item.address) continue;
          const symbol = item.symbol.toUpperCase();
          if (symbol !== "TAIKO" && symbol !== "USDC" && symbol !== "WETH") continue;

          tokenBySymbol.set(symbol, {
            symbol,
            name: item.name ?? symbol,
            type: "ERC20",
            l1Address: l1BySymbol[symbol] ?? null,
            l2Address: item.address,
          });
        }
      } catch {
        // Fall back to curated defaults if Blockscout is unavailable.
      }

      const tokens = Array.from(tokenBySymbol.values());

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              network,
              tokens,
              note:
                "Token mappings are best-effort from Blockscout token index plus known L1 canonical addresses. " +
                "If l1Address is null, resolve canonical mapping from bridge.taiko.xyz before bridging.",
            }),
          },
        ],
      };
    }
  );
}
