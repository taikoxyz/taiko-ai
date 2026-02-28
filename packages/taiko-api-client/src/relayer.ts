import { NETWORKS, type Network } from "./networks.js";

export interface RelayerEvent {
  id: number;
  name: string;
  data: {
    Raw: {
      address: string;
      transactionHash: string;
      blockNumber: string;
    };
    Message?: {
      id: string;
      fee: string;
      gasLimit: string;
      from: string;
      srcChainId: string;
      srcOwner: string;
      destChainId: string;
      destOwner: string;
      to: string;
      value: string;
      data: string;
    };
  };
  status: number; // 0=NEW, 1=RETRIABLE, 2=DONE, 3=FAILED, 4=RECALLED
  eventType: number;
  chainID: number;
  destChainID: number;
  msgHash?: string;
  msgHashField?: string;
  canonicalTokenAddress?: string;
  canonicalTokenSymbol?: string;
  canonicalTokenName?: string;
  canonicalTokenDecimals?: number;
  amount?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RelayerEventsResponse {
  items: RelayerEvent[];
  page: number;
  size: number;
  total: number;
  /** @deprecated Live relayer API uses `last`/`first`/`total_pages`/`visible` instead. */
  end?: boolean;
  first?: boolean;
  last?: boolean;
  max_page?: number;
  total_pages?: number;
  visible?: number;
}

export interface RelayerBlockInfoEntry {
  chainID: number;
  latestProcessedBlock: number;
  latestBlock: number;
}

export interface RelayerBlockInfo {
  data: RelayerBlockInfoEntry[];
}

export const MESSAGE_STATUS = ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"] as const;
export type MessageStatus = (typeof MESSAGE_STATUS)[number];

export function statusToString(status: number): MessageStatus {
  return MESSAGE_STATUS[status] ?? "UNKNOWN";
}

export class RelayerClient {
  private async fetch<T>(network: Network, path: string, params?: Record<string, string>): Promise<T> {
    const base = NETWORKS[network].relayer;
    const url = new URL(`${base}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await globalThis.fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Relayer HTTP ${res.status} for ${path}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async getEvents(address: string, network: Network = "mainnet", page = 1, size = 25): Promise<RelayerEventsResponse> {
    return this.fetch<RelayerEventsResponse>(network, "/events", {
      address,
      page: String(page),
      size: String(size),
    });
  }

  async getEventByMsgHash(msgHash: string, network: Network = "mainnet"): Promise<RelayerEvent | null> {
    // The relayer has no /events/{msgHash} endpoint (routes: GET /events, /blockInfo, /recommendedProcessingFees)
    // Filter by msgHash from the events list — not efficient for unknown addresses, returns null if not found
    try {
      const response = await this.fetch<RelayerEventsResponse>(network, "/events", {
        msgHash,
        page: "1",
        size: "5",
      });
      return response.items[0] ?? null;
    } catch {
      return null;
    }
  }

  async getBlockInfo(network: Network = "mainnet"): Promise<RelayerBlockInfo> {
    return this.fetch<RelayerBlockInfo>(network, "/blockInfo");
  }

  async getPendingMessages(address: string, network: Network = "mainnet"): Promise<RelayerEvent[]> {
    const response = await this.getEvents(address, network);
    return response.items.filter((e) => e.status < 2); // Not DONE or RECALLED
  }

  async getBridgeHistory(address: string, network: Network = "mainnet"): Promise<RelayerEventsResponse> {
    return this.getEvents(address, network);
  }

  async getMessageStatus(msgHash: string, network: Network = "mainnet"): Promise<MessageStatus | null> {
    const event = await this.getEventByMsgHash(msgHash, network);
    if (!event) return null;
    return statusToString(event.status);
  }
}
