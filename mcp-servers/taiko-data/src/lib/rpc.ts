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
export async function taikoRpcCall<T>(
  network: Network,
  method: string,
  params: unknown[] = [],
): Promise<T> {
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

export interface L1OriginInfo {
  blockID: string;
  l2BlockHash: string;
  l1BlockHeight: string;
  l1BlockHash: string;
  isForcedInclusion?: boolean;
}

/** Get the current L1 origin block info anchored in the latest L2 block */
export async function getHeadL1Origin(network: Network): Promise<L1OriginInfo> {
  return taikoRpcCall<L1OriginInfo>(network, "taiko_headL1Origin", []);
}
