import { z } from "zod";
import { parseEther, isAddress } from "viem";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NETWORKS, RelayerClient, type RelayerEvent } from "@taikoxyz/taiko-api-client";
import { IBridgeABI, IERC20VaultABI } from "../lib/abis.js";
import { BRIDGE_CONTRACTS, DEFAULT_GAS_LIMITS, type TaikoNetwork, type BridgeDirection } from "../networks.js";
import { makePublicClient, makeWalletClient, resolveBridgeAddress, resolveChain } from "../lib/clients.js";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

/** Warn (but don't block) for large mainnet amounts. */
function checkLargeAmount(amountWei: bigint, network: TaikoNetwork): string | null {
  if (network === "mainnet" && amountWei > parseEther("1")) {
    return `WARNING: Bridging ${Number(amountWei) / 1e18} ETH on mainnet — confirm this is intentional.`;
  }
  return null;
}

/** Fetch recommended ETH processing fee from the relayer. */
async function getRecommendedEthFee(network: TaikoNetwork): Promise<bigint> {
  try {
    const relayerBase = NETWORKS[network].relayer;
    const resp = await fetch(`${relayerBase}/recommendedProcessingFees`);
    if (!resp.ok) return 0n;
    const data = (await resp.json()) as {
      fees: Array<{ type: string; amount: string }>;
    };
    const ethFee = data.fees.find((f) => f.type === "eth");
    return ethFee ? BigInt(ethFee.amount) : 0n;
  } catch {
    console.warn(`[taiko-bridge] Failed to fetch recommended ETH fee from relayer for ${network}, defaulting to 0`);
    return 0n;
  }
}

/** Fetch the full message object for a given msgHash from the relayer. */
async function fetchMessageByHash(msgHash: string, network: TaikoNetwork) {
  const relayer = new RelayerClient();
  const event: RelayerEvent | null = await relayer.getEventByMsgHash(msgHash, network);
  if (!event?.data?.Message) {
    throw new Error(
      `Message not found for hash ${msgHash}. ` +
        "Ensure the bridge transaction has been confirmed and the relayer has indexed it."
    );
  }
  const msg = event.data.Message;
  return {
    id: BigInt(msg.id),
    fee: BigInt(msg.fee),
    gasLimit: Number(msg.gasLimit), // uint32, safe as Number
    from: msg.from as `0x${string}`,
    srcChainId: BigInt(msg.srcChainId),
    srcOwner: msg.srcOwner as `0x${string}`,
    destChainId: BigInt(msg.destChainId),
    destOwner: msg.destOwner as `0x${string}`,
    to: msg.to as `0x${string}`,
    value: msg.value,
    data: msg.data as `0x${string}`,
  };
}

export function registerWriteTools(server: McpServer): void {
  // ─── bridge_eth ────────────────────────────────────────────────────────────
  server.tool(
    "bridge_eth",
    "Bridge ETH between L1 and Taiko L2. " +
      "Calls IBridge.sendMessage on the source chain. " +
      "SECURITY: Always simulates the transaction before executing. " +
      "Requires TAIKO_PRIVATE_KEY (or TAIKO_MAINNET/HOODI_PRIVATE_KEY) in environment.",
    {
      amount: z.string().describe('ETH amount to bridge (e.g. "0.1")'),
      direction: z.enum(["L1_TO_L2", "L2_TO_L1"]).describe("Bridge direction"),
      network: networkParam,
      to: z.string().optional().describe("Recipient address on destination chain (default: your own address)"),
      fee: z.string().optional().describe("Relayer processing fee in wei (default: auto from relayer recommendation)"),
    },
    async ({ amount, direction, network, to, fee }) => {
      const net = network as TaikoNetwork;
      const dir = direction as BridgeDirection;

      const amountWei = parseEther(amount);
      if (amountWei <= 0n) throw new Error("Amount must be positive");

      if (to && !isAddress(to)) {
        throw new Error(`Invalid recipient address: ${to}`);
      }

      const { account, client: walletClient } = makeWalletClient(net, dir);
      const bridgeAddress = resolveBridgeAddress(net, dir);
      const chain = resolveChain(net, dir);
      const publicClient = makePublicClient(chain);

      const recipientAddress = (to as `0x${string}` | undefined) ?? account.address;
      const relayerFee = fee ? BigInt(fee) : await getRecommendedEthFee(net);

      if (relayerFee > 2n ** 64n - 1n) {
        throw new Error("Relayer fee exceeds uint64 maximum");
      }

      const warning = checkLargeAmount(amountWei, net);
      const contracts = BRIDGE_CONTRACTS[net];
      const destChainId = contracts.destChainIds[dir];

      const message = {
        id: 0n,
        fee: relayerFee,
        gasLimit: DEFAULT_GAS_LIMITS.eth,
        from: account.address,
        srcChainId: 0n,
        srcOwner: account.address,
        destChainId,
        destOwner: recipientAddress,
        to: recipientAddress,
        value: amountWei,
        data: "0x" as `0x${string}`,
      };

      const totalValue = amountWei + relayerFee;

      const { request } = await publicClient.simulateContract({
        address: bridgeAddress,
        abi: IBridgeABI,
        functionName: "sendMessage",
        args: [message],
        value: totalValue,
        account: account.address,
      });

      const txHash = await walletClient.writeContract(request);

      const result: Record<string, unknown> = {
        txHash,
        amount,
        direction,
        network: net,
        from: account.address,
        to: recipientAddress,
        relayerFee: relayerFee.toString(),
        totalValueWei: totalValue.toString(),
        note:
          dir === "L2_TO_L1"
            ? "L2→L1 messages require ~24 hours on mainnet before they can be claimed on L1."
            : "L1→L2 messages are typically relayed within minutes.",
      };

      if (warning) result.warning = warning;

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    }
  );

  // ─── bridge_erc20 ─────────────────────────────────────────────────────────
  server.tool(
    "bridge_erc20",
    "Bridge ERC-20 tokens between L1 and Taiko L2. " +
      "Calls IERC20Vault.bridgeToken on the source chain. " +
      "SECURITY: Always simulates before executing. Requires token approval first. " +
      "NOTE: Currently L1→L2 ERC20 bridging requires the L1 ERC20Vault address (see Taiko docs).",
    {
      token: z.string().describe("Token contract address on the source chain"),
      amount: z.string().describe("Token amount in smallest unit (e.g. wei for 18-decimal tokens)"),
      direction: z.enum(["L1_TO_L2", "L2_TO_L1"]).describe("Bridge direction"),
      network: networkParam,
      to: z.string().optional().describe("Recipient address on destination chain (default: your own address)"),
      fee: z.string().optional().describe("Relayer processing fee in wei (default: auto from relayer recommendation)"),
    },
    async ({ token, amount, direction, network, to, fee }) => {
      const net = network as TaikoNetwork;
      const dir = direction as BridgeDirection;

      if (!isAddress(token)) {
        throw new Error(`Invalid token address: ${token}`);
      }
      if (to && !isAddress(to)) {
        throw new Error(`Invalid recipient address: ${to}`);
      }

      const tokenAmount = BigInt(amount);
      if (tokenAmount <= 0n) throw new Error("Amount must be positive");

      const { account, client: walletClient } = makeWalletClient(net, dir);
      const contracts = BRIDGE_CONTRACTS[net];
      // Select vault by direction: L1→L2 uses L1 vault, L2→L1 uses L2 vault
      const vaultAddress = dir === "L1_TO_L2" ? contracts.l1ERC20Vault : contracts.l2ERC20Vault;

      const chain = resolveChain(net, dir);
      const publicClient = makePublicClient(chain);
      const recipientAddress = (to as `0x${string}` | undefined) ?? account.address;
      const relayerFee = fee ? BigInt(fee) : await getRecommendedEthFee(net);
      const destChainId = contracts.destChainIds[dir];

      const op = {
        destChainId,
        destOwner: recipientAddress,
        to: recipientAddress,
        fee: relayerFee,
        token: token as `0x${string}`,
        gasLimit: DEFAULT_GAS_LIMITS.erc20Deployed,
        amount: tokenAmount,
      };

      const { request } = await publicClient.simulateContract({
        address: vaultAddress as `0x${string}`,
        abi: IERC20VaultABI,
        functionName: "bridgeToken",
        args: [op],
        value: relayerFee,
        account: account.address,
      });

      const txHash = await walletClient.writeContract(request);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              txHash,
              token,
              amount,
              direction,
              network: net,
              from: account.address,
              to: recipientAddress,
              relayerFee: relayerFee.toString(),
              note: "Ensure the ERC20Vault has token approval before calling this. Use token.approve(vaultAddress, amount) first.",
            }),
          },
        ],
      };
    }
  );

  // ─── retry_message ─────────────────────────────────────────────────────────
  server.tool(
    "retry_message",
    "Retry a failed or stuck bridge message. " +
      "Fetches the message struct from the relayer and calls IBridge.retryMessage. " +
      "Use when a message is in RETRIABLE status.",
    {
      msgHash: z.string().describe("The 0x-prefixed bytes32 message hash"),
      network: networkParam,
      isLastAttempt: z
        .boolean()
        .default(false)
        .describe("If true, marks this as the final retry — failed messages become FAILED permanently"),
      chain: z
        .enum(["l1", "l2"])
        .default("l2")
        .describe("Chain where the retry tx should be sent — l2 for L1→L2 messages, l1 for L2→L1"),
    },
    async ({ msgHash, network, isLastAttempt, chain }) => {
      const net = network as TaikoNetwork;
      const dir: BridgeDirection = chain === "l1" ? "L2_TO_L1" : "L1_TO_L2";

      const rawMessage = await fetchMessageByHash(msgHash, net);

      const message = {
        id: BigInt(rawMessage.id),
        fee: BigInt(rawMessage.fee),
        gasLimit: rawMessage.gasLimit,
        from: rawMessage.from,
        srcChainId: BigInt(rawMessage.srcChainId),
        srcOwner: rawMessage.srcOwner,
        destChainId: BigInt(rawMessage.destChainId),
        destOwner: rawMessage.destOwner,
        to: rawMessage.to,
        value: BigInt(rawMessage.value),
        data: rawMessage.data,
      };

      const bridgeAddress = resolveBridgeAddress(net, dir);
      const bridgeChain = resolveChain(net, dir);
      const publicClient = makePublicClient(bridgeChain);
      const { account, client: walletClient } = makeWalletClient(net, dir);

      const { request } = await publicClient.simulateContract({
        address: bridgeAddress,
        abi: IBridgeABI,
        functionName: "retryMessage",
        args: [message, isLastAttempt],
        account: account.address,
      });

      const txHash = await walletClient.writeContract(request);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              txHash,
              msgHash,
              network: net,
              isLastAttempt,
            }),
          },
        ],
      };
    }
  );

  // ─── recall_message ────────────────────────────────────────────────────────
  server.tool(
    "recall_message",
    "Recall a failed bridge message to get a refund on the source chain. " +
      "Only callable by the srcOwner. Message must be in FAILED status. " +
      "Fetches the message struct from the relayer and calls IBridge.recallMessage.",
    {
      msgHash: z.string().describe("The 0x-prefixed bytes32 message hash"),
      network: networkParam,
      direction: z
        .enum(["L1_TO_L2", "L2_TO_L1"])
        .default("L1_TO_L2")
        .describe("The original bridge direction — recall is called on the SOURCE chain"),
      proof: z.string().default("0x").describe("Proof bytes (hex, default: 0x — empty proof for most cases)"),
    },
    async ({ msgHash, network, direction, proof }) => {
      const net = network as TaikoNetwork;
      const dir = direction as BridgeDirection;

      const rawMessage = await fetchMessageByHash(msgHash, net);

      const message = {
        id: BigInt(rawMessage.id),
        fee: BigInt(rawMessage.fee),
        gasLimit: rawMessage.gasLimit,
        from: rawMessage.from,
        srcChainId: BigInt(rawMessage.srcChainId),
        srcOwner: rawMessage.srcOwner,
        destChainId: BigInt(rawMessage.destChainId),
        destOwner: rawMessage.destOwner,
        to: rawMessage.to,
        value: BigInt(rawMessage.value),
        data: rawMessage.data,
      };

      const bridgeAddress = resolveBridgeAddress(net, dir);
      const bridgeChain = resolveChain(net, dir);
      const publicClient = makePublicClient(bridgeChain);
      const { account, client: walletClient } = makeWalletClient(net, dir);

      const { request } = await publicClient.simulateContract({
        address: bridgeAddress,
        abi: IBridgeABI,
        functionName: "recallMessage",
        args: [message, proof as `0x${string}`],
        account: account.address,
      });

      const txHash = await walletClient.writeContract(request);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              txHash,
              msgHash,
              network: net,
              direction,
              note: "Refund will be sent to the srcOwner address on the source chain.",
            }),
          },
        ],
      };
    }
  );
}
