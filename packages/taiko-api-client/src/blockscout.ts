import { NETWORKS, type Network } from "./networks.js";

export interface BlockscoutSearchResult {
  items: BlockscoutSearchItem[];
  next_page_params: unknown;
}

export interface BlockscoutSearchItem {
  type: "address" | "token" | "transaction" | "block" | "contract";
  address?: string;
  name?: string;
  symbol?: string;
  token_type?: string;
  is_smart_contract_verified?: boolean;
  url?: string;
}

export interface BlockscoutAddressCounters {
  transactions_count: string;
  token_transfers_count: string;
  gas_usage_count: string;
  validations_count: string;
}

export interface BlockscoutSmartContract {
  address: string;
  name: string;
  compiler_version: string;
  is_verified: boolean;
  source_code: string | null;
  abi: unknown[] | null;
}

export interface BlockscoutToken {
  address: string;
  name: string;
  symbol: string;
  type: string;
  decimals: string;
  holders: string;
}

export interface BlockscoutTokensResponse {
  items: BlockscoutToken[];
}

export class BlockscoutClient {
  private async fetch<T>(network: Network, path: string, params?: Record<string, string>): Promise<T> {
    const base = NETWORKS[network].blockscout;
    const url = new URL(`${base}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await globalThis.fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Blockscout HTTP ${res.status} for ${path}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  async search(query: string, network: Network = "mainnet"): Promise<BlockscoutSearchResult> {
    return this.fetch<BlockscoutSearchResult>(network, "/search", { q: query });
  }

  async getAddressCounters(address: string, network: Network = "mainnet"): Promise<BlockscoutAddressCounters> {
    return this.fetch<BlockscoutAddressCounters>(network, `/addresses/${address}/counters`);
  }

  async getSimilarContracts(address: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, `/smart-contracts/${address}/similar`);
  }

  async getSmartContract(address: string, network: Network = "mainnet"): Promise<BlockscoutSmartContract> {
    return this.fetch<BlockscoutSmartContract>(network, `/smart-contracts/${address}`);
  }

  async getAddress(address: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, `/addresses/${address}`);
  }

  async getTransactions(address: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, `/addresses/${address}/transactions`, {
      filter: "to | from",
    });
  }

  async getTokens(
    network: Network = "mainnet",
    opts: {
      type?: "ERC-20" | "ERC-721" | "ERC-1155";
    } = {}
  ): Promise<BlockscoutTokensResponse> {
    const params: Record<string, string> = {};
    if (opts.type) params.type = opts.type;
    return this.fetch<BlockscoutTokensResponse>(network, "/tokens", params);
  }
}
