import {
  createPublicClient,
  createWalletClient,
  http,
  type Account,
  type WalletClient,
  type PublicClient,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { BRIDGE_CONTRACTS, type TaikoNetwork, type BridgeDirection } from "../networks.js";

/** Resolve the signing private key for a given network. */
export function resolvePrivateKey(network: TaikoNetwork): `0x${string}` {
  const networkKey =
    network === "mainnet" ? process.env.TAIKO_MAINNET_PRIVATE_KEY : process.env.TAIKO_HOODI_PRIVATE_KEY;

  const key = networkKey ?? process.env.TAIKO_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      `No private key configured. Set TAIKO_PRIVATE_KEY or TAIKO_${network.toUpperCase()}_PRIVATE_KEY in your environment.`
    );
  }
  if (!key.startsWith("0x") || key.length !== 66) {
    throw new Error("Private key must be a 32-byte hex string starting with 0x");
  }
  return key as `0x${string}`;
}

/** Get the chain for a given network + direction pair. */
export function resolveChain(network: TaikoNetwork, direction: BridgeDirection): Chain {
  const contracts = BRIDGE_CONTRACTS[network];
  return direction === "L1_TO_L2" ? contracts.l1Chain : contracts.l2Chain;
}

/** Get the bridge contract address for the source chain. */
export function resolveBridgeAddress(network: TaikoNetwork, direction: BridgeDirection): `0x${string}` {
  const contracts = BRIDGE_CONTRACTS[network];
  return direction === "L1_TO_L2" ? contracts.l1Bridge : contracts.l2Bridge;
}

/** Create a read-only viem public client. */
export function makePublicClient(chain: Chain): PublicClient {
  return createPublicClient({ chain, transport: http() });
}

/** Create a wallet client + account for signing transactions. */
export function makeWalletClient(
  network: TaikoNetwork,
  direction: BridgeDirection
): { account: Account; client: WalletClient } {
  const privateKey = resolvePrivateKey(network);
  const account = privateKeyToAccount(privateKey);
  const chain = resolveChain(network, direction);
  const client = createWalletClient({ account, chain, transport: http() });
  return { account, client };
}
