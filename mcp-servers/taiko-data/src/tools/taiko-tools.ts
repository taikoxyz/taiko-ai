import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ethers } from "ethers";
import { z } from "zod";
import { TaikoscanClient, BlockscoutClient, RelayerClient } from "@taikoxyz/taiko-api-client";
import { getProvider, getHeadL1Origin } from "../lib/rpc.js";
import { NETWORKS, type Network } from "../networks.js";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

// Minimal ABI for TaikoAnchor getCheckpoint function
const ANCHOR_ABI = ["function getCheckpoint(uint256 blockId) view returns (bytes32 stateRoot, bytes32 signalRoot)"];

export function registerTaikoTools(
  server: McpServer,
  taikoscan: TaikoscanClient,
  blockscout: BlockscoutClient,
  relayer: RelayerClient
): void {
  // get_anchor_block_state
  server.tool(
    "get_anchor_block_state",
    "Get the L1 block that the latest Taiko L2 block is anchored to, plus the L1 lag. This shows how up-to-date the L2 is relative to Ethereum L1.",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const [l1Origin, provider] = await Promise.all([getHeadL1Origin(network), getProvider(network)]);
      const l2BlockNumber = await provider.getBlockNumber();
      const l1BlockHeight = parseInt(l1Origin.l1BlockHeight, 16);
      const l2BlockId = parseInt(l1Origin.blockID, 16);

      // Get current Ethereum L1 block number for lag calculation
      let l1CurrentBlock: number | null = null;
      try {
        const l1RpcUrl =
          network === "mainnet"
            ? (process.env.TAIKO_L1_RPC ?? process.env.TAIKO_L1_MAINNET_RPC ?? "https://eth.drpc.org")
            : (process.env.TAIKO_L1_RPC ?? process.env.TAIKO_L1_HOODI_RPC ?? "https://hoodi.drpc.org");
        const l1Res = await globalThis.fetch(l1RpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
        });
        if (l1Res.ok) {
          const l1Data = (await l1Res.json()) as { result: string };
          l1CurrentBlock = parseInt(l1Data.result, 16);
        }
      } catch {
        // L1 lag calculation optional
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              network,
              l2BlockNumber,
              l2BlockId,
              anchoredToL1Block: l1BlockHeight,
              l1BlockHash: l1Origin.l1BlockHash,
              l2BlockHash: l1Origin.l2BlockHash,
              l1CurrentBlock,
              l1LagBlocks: l1CurrentBlock ? l1CurrentBlock - l1BlockHeight : null,
              isForcedInclusion: l1Origin.isForcedInclusion ?? false,
            }),
          },
        ],
      };
    }
  );

  // get_l1_checkpoint
  server.tool(
    "get_l1_checkpoint",
    "Get the L1 state root anchored in a specific Taiko L2 block via the TaikoAnchor contract",
    {
      l2_block_number: z.number().int().describe("L2 block number to query the L1 checkpoint for"),
      network: networkParam,
    },
    async ({ l2_block_number, network }) => {
      const provider = getProvider(network);
      const anchorAddress = NETWORKS[network].anchor;
      const anchor = new ethers.Contract(anchorAddress, ANCHOR_ABI, provider);

      let checkpoint: { stateRoot: string; signalRoot: string } | null = null;
      try {
        const result = (await anchor.getCheckpoint(BigInt(l2_block_number))) as [string, string];
        checkpoint = {
          stateRoot: result[0] ?? result,
          signalRoot: result[1] ?? null,
        };
      } catch (err) {
        // getCheckpoint may not be the correct function name on this Taiko version
        // Fall back to checking the block anchor tx
        checkpoint = null;
      }

      // If on-chain call fails, return L1 origin info from RPC with clear warning
      if (!checkpoint) {
        const l1Origin = await getHeadL1Origin(network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                network,
                l2BlockNumber: l2_block_number,
                warning: `getCheckpoint not available for block ${l2_block_number}; returning current HEAD L1 origin instead. This is NOT the L1 state at block ${l2_block_number}.`,
                l1BlockHeight: parseInt(l1Origin.l1BlockHeight, 16),
                l1BlockHash: l1Origin.l1BlockHash,
                l2BlockHash: l1Origin.l2BlockHash,
              }),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              network,
              l2BlockNumber: l2_block_number,
              anchorAddress,
              stateRoot: checkpoint.stateRoot,
              signalRoot: checkpoint.signalRoot,
            }),
          },
        ],
      };
    }
  );

  // get_bridge_message_status
  server.tool(
    "get_bridge_message_status",
    "Get the current relay status of a Taiko bridge message. Status: NEW, RETRIABLE, DONE, FAILED, or RECALLED.",
    {
      msg_hash: z.string().describe("Bridge message hash (0x...) or transaction hash of the bridge sendMessage tx"),
      network: networkParam,
    },
    async ({ msg_hash, network }) => {
      // Try relayer API first
      const status = await relayer.getMessageStatus(msg_hash, network);

      if (status) {
        const event = await relayer.getEventByMsgHash(msg_hash, network);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                network,
                msgHash: msg_hash,
                status,
                source: "relayer_api",
                event: event
                  ? {
                      destChainId: event.destChainID,
                      srcChainId: event.chainID,
                      amount: event.amount,
                      canonicalToken: event.canonicalTokenSymbol ?? null,
                      createdAt: event.createdAt,
                      updatedAt: event.updatedAt,
                    }
                  : null,
              }),
            },
          ],
        };
      }

      // Fallback: check on-chain IBridge.messageStatus
      const BRIDGE_STATUS_ABI = ["function messageStatus(bytes32 msgHash) view returns (uint8)"];
      const provider = getProvider(network);
      const bridgeAddress = NETWORKS[network].bridge as string;
      const bridge = new ethers.Contract(bridgeAddress, BRIDGE_STATUS_ABI, provider);
      const STATUS_NAMES = ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"];
      try {
        const statusNum = (await bridge.messageStatus(msg_hash)) as bigint;
        const statusName = STATUS_NAMES[Number(statusNum)] ?? "UNKNOWN";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                network,
                msgHash: msg_hash,
                status: statusName,
                statusCode: Number(statusNum),
                source: "on_chain",
              }),
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                network,
                msgHash: msg_hash,
                status: null,
                error: "Message not found in relayer or on-chain. Hash may be a tx hash, not a message hash.",
              }),
            },
          ],
        };
      }
    }
  );

  // get_nft_holdings
  server.tool(
    "get_nft_holdings",
    "Get all ERC-721 and ERC-1155 NFT holdings for an address on Taiko",
    {
      address: z.string().describe("Ethereum address to check NFT holdings for"),
      type: z.enum(["ERC-721", "ERC-1155", "all"]).default("all").describe("Token standard to filter by"),
      network: networkParam,
    },
    async ({ address, type, network }) => {
      const holdings = await taikoscan.getNFTHoldings(address, network, type);
      const nfts = holdings.filter((h) => h.tokenType === "ERC-721" || h.tokenType === "ERC-1155");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              address,
              network,
              type,
              count: nfts.length,
              holdings: nfts.map((h) => ({
                contractAddress: h.contractAddress,
                tokenName: h.tokenName,
                symbol: h.symbol,
                tokenType: h.tokenType,
                balance: h.balance,
              })),
            }),
          },
        ],
      };
    }
  );

  // search
  server.tool(
    "search",
    "Search Taiko by address, transaction hash, block number, or token name. Returns matching results from Blockscout.",
    {
      query: z.string().describe("Search query: address (0x...), tx hash (0x...), block number, or token name"),
      network: networkParam,
    },
    async ({ query, network }) => {
      // Detect query type
      const isAddress = /^0x[0-9a-fA-F]{40}$/.test(query);
      const isTxHash = /^0x[0-9a-fA-F]{64}$/.test(query);
      const isBlockNumber = /^\d+$/.test(query);

      if (isAddress || isTxHash || isBlockNumber) {
        // Direct lookups
        const provider = getProvider(network);
        if (isAddress) {
          const [balance, code] = await Promise.all([provider.getBalance(query), provider.getCode(query)]);
          const isContract = code !== "0x";
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  query,
                  network,
                  type: isContract ? "contract" : "address",
                  address: query,
                  balance: ethers.formatEther(balance),
                  isContract,
                  explorerUrl: `${NETWORKS[network].taikoscanExplorer}/address/${query}`,
                }),
              },
            ],
          };
        }
        if (isTxHash) {
          const tx = await provider.getTransaction(query);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  query,
                  network,
                  type: "transaction",
                  found: !!tx,
                  blockNumber: tx?.blockNumber,
                  from: tx?.from,
                  to: tx?.to,
                  explorerUrl: `${NETWORKS[network].taikoscanExplorer}/tx/${query}`,
                }),
              },
            ],
          };
        }
        if (isBlockNumber) {
          const block = await provider.getBlock(parseInt(query));
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  query,
                  network,
                  type: "block",
                  found: !!block,
                  number: block?.number,
                  hash: block?.hash,
                  timestamp: block?.timestamp,
                  transactionCount: block?.transactions.length,
                  explorerUrl: `${NETWORKS[network].taikoscanExplorer}/block/${query}`,
                }),
              },
            ],
          };
        }
      }

      // Token/name search via Blockscout
      const results = await blockscout.search(query, network);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              network,
              count: results.items.length,
              results: results.items.slice(0, 10).map((item) => ({
                type: item.type,
                address: item.address,
                name: item.name,
                symbol: item.symbol,
                tokenType: item.token_type,
                isVerified: item.is_smart_contract_verified,
                explorerUrl: item.address ? `${NETWORKS[network].taikoscanExplorer}/address/${item.address}` : null,
              })),
            }),
          },
        ],
      };
    }
  );
}
