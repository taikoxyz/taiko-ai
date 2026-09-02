import { ethers } from "ethers";
import { NETWORKS, type Network } from "../networks.js";

const providerCache = new Map<Network, ethers.JsonRpcProvider>();

export function getProvider(network: Network): ethers.JsonRpcProvider {
  let provider = providerCache.get(network);
  if (!provider) {
    provider = new ethers.JsonRpcProvider(NETWORKS[network].rpc);
    providerCache.set(network, provider);
  }
  return provider;
}

/** Call a Taiko-specific JSON-RPC method directly */
export async function taikoRpcCall<T>(network: Network, method: string, params: unknown[] = []): Promise<T> {
  const rpc = NETWORKS[network].rpc;
  const res = await globalThis.fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  if (!res.ok) {
    throw new Error(`RPC HTTP ${res.status}: ${res.statusText}`);
  }
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) {
    throw new Error(`RPC error for ${method}: ${json.error.message}`);
  }
  return json.result as T;
}

/**
 * Raw `taiko_headL1Origin` payload. The L2 block number field was renamed between taiko-geth
 * versions and the networks are not in sync: mainnet returns `blockId`, Hoodi still returns
 * `blockID`. Both spellings are accepted and normalized by getHeadL1Origin.
 */
interface RawL1Origin {
  blockId?: string;
  blockID?: string;
  l2BlockHash: string;
  l1BlockHeight: string;
  l1BlockHash: string;
  isForcedInclusion?: boolean;
}

export interface L1OriginInfo {
  /** L2 block number as a hex quantity. Normalized from the node's blockId/blockID. */
  blockId: string;
  l2BlockHash: string;
  l1BlockHeight: string;
  l1BlockHash: string;
  isForcedInclusion?: boolean;
}

/** Get the current L1 origin block info anchored in the latest L2 block */
export async function getHeadL1Origin(network: Network): Promise<L1OriginInfo> {
  const raw = await taikoRpcCall<RawL1Origin>(network, "taiko_headL1Origin", []);
  const blockId = raw.blockId ?? raw.blockID;
  if (blockId === undefined) {
    throw new Error("taiko_headL1Origin returned neither blockId nor blockID");
  }
  return {
    blockId,
    l2BlockHash: raw.l2BlockHash,
    l1BlockHeight: raw.l1BlockHeight,
    l1BlockHash: raw.l1BlockHash,
    isForcedInclusion: raw.isForcedInclusion,
  };
}
