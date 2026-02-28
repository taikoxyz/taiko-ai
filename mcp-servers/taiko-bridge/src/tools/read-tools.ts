import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NETWORKS, RelayerClient } from "@taikoxyz/taiko-api-client";
import { IBridgeABI, statusToLabel } from "../lib/abis.js";
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
        .describe(
          "Which chain to query on-chain status — l1 for L2→L1 messages, l2 for L1→L2 (default: l2)"
        ),
    },
    async ({ msgHash, network, chain }) => {
      const net = network as TaikoNetwork;
      const relayer = new RelayerClient();

      // 1. Try relayer API
      try {
        const event = await relayer.getEventByMsgHash(msgHash, net);
        if (event) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  msgHash,
                  status: event.status,
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
              status: statusToLabel(Number(statusCode)),
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
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(events),
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
    },
    async ({ address, network }) => {
      const net = network as TaikoNetwork;
      const relayer = new RelayerClient();
      const events = await relayer.getEvents(address, net, 1, 100);

      // Filter to pending (NEW=0, RETRIABLE=1)
      const pending = events.items?.filter((e) => e.status === 0 || e.status === 1) ?? [];

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
      "Returns canonical token addresses on both L1 and L2.",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const tokens =
        network === "mainnet"
          ? [
              {
                symbol: "ETH",
                name: "Ether",
                type: "native",
                l1Address: "native",
                l2Address: "native",
              },
              {
                symbol: "TAIKO",
                name: "Taiko Token",
                type: "ERC20",
                l1Address: "0x10dea67478c5F8C5E2D90e5E9B26dBe60c54d800",
                l2Address: "0xa9d23408b9bA935c230493c40C73824Df71A0975",
              },
              {
                symbol: "USDC",
                name: "USD Coin",
                type: "ERC20",
                l1Address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
                l2Address: "check Taikoscan for canonical bridged USDC",
              },
              {
                symbol: "WETH",
                name: "Wrapped Ether",
                type: "ERC20",
                l1Address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
                l2Address: "check Taikoscan for canonical bridged WETH",
              },
            ]
          : [
              {
                symbol: "ETH",
                name: "Ether",
                type: "native",
                l1Address: "native",
                l2Address: "native",
              },
              {
                symbol: "TAIKO",
                name: "Taiko Token (Hoodi)",
                type: "ERC20",
                l1Address: "check hoodi.taikoscan.io",
                l2Address: "check hoodi.taikoscan.io",
              },
            ];

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              network,
              tokens,
              note: "For the full canonical token list with verified addresses, check https://bridge.taiko.xyz or query the Taikoscan token API.",
            }),
          },
        ],
      };
    }
  );
}
