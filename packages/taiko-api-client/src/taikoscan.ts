import { NETWORKS, type Network } from "./networks.js";

export interface TaikoscanResponse<T> {
  status: "0" | "1";
  message: string;
  result: T;
}

export interface TokenBalance {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark: string;
  description: string;
  logo: string;
  website: string;
  email: string;
  balance: string;
}

export interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
}

export interface ContractCreator {
  contractAddress: string;
  contractCreator: string;
  txHash: string;
}

export interface GasOracle {
  LastBlock: string;
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
  suggestBaseFee: string;
  gasUsedRatio: string;
}

export class TaikoscanClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.TAIKOSCAN_API_KEY ?? "";
  }

  private async fetch<T>(network: Network, params: Record<string, string>): Promise<T> {
    const net = NETWORKS[network];
    const chainId = String(net.chainId);
    const url = new URL(net.etherscanV2);
    url.searchParams.set("chainid", chainId);
    url.searchParams.set("apikey", this.apiKey);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await globalThis.fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Taikoscan HTTP ${res.status}: ${res.statusText}`);
    }
    const json = (await res.json()) as TaikoscanResponse<T>;
    if (json.status === "0" && json.message !== "No transactions found") {
      throw new Error(`Taikoscan API error: ${json.message} — ${JSON.stringify(json.result)}`);
    }
    return json.result;
  }

  async getBalance(address: string, network: Network = "mainnet"): Promise<string> {
    return this.fetch<string>(network, {
      module: "account",
      action: "balance",
      address,
      tag: "latest",
    });
  }

  async getTransactions(
    address: string,
    network: Network = "mainnet",
    page = 1,
    limit = 25,
  ): Promise<Transaction[]> {
    const result = await this.fetch<Transaction[] | "">(network, {
      module: "account",
      action: "txlist",
      address,
      startblock: "0",
      endblock: "99999999",
      page: String(page),
      offset: String(limit),
      sort: "desc",
    });
    return Array.isArray(result) ? result : [];
  }

  async getTokenTransfers(
    address: string,
    network: Network = "mainnet",
    contractAddress?: string,
  ): Promise<Transaction[]> {
    const params: Record<string, string> = {
      module: "account",
      action: "tokentx",
      address,
      sort: "desc",
      offset: "25",
      page: "1",
    };
    if (contractAddress) params.contractaddress = contractAddress;
    const result = await this.fetch<Transaction[] | "">(network, params);
    return Array.isArray(result) ? result : [];
  }

  async getContractABI(address: string, network: Network = "mainnet"): Promise<string> {
    return this.fetch<string>(network, {
      module: "contract",
      action: "getabi",
      address,
    });
  }

  async getContractSource(address: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, {
      module: "contract",
      action: "getsourcecode",
      address,
    });
  }

  async getContractCreator(address: string, network: Network = "mainnet"): Promise<ContractCreator[]> {
    const result = await this.fetch<ContractCreator[] | "">(network, {
      module: "contract",
      action: "getcontractcreation",
      contractaddresses: address,
    });
    return Array.isArray(result) ? result : [];
  }

  async getNFTHoldings(
    address: string,
    network: Network = "mainnet",
    type: "ERC-721" | "ERC-1155" | "all" = "all",
  ): Promise<TokenBalance[]> {
    const params: Record<string, string> = {
      module: "account",
      action: "addresstokenbalance",
      address,
      page: "1",
      offset: "50",
    };
    if (type !== "all") {
      // Taikoscan: filter by token type
      // Passing contracttype is supported on some Etherscan-compat endpoints
    }
    const result = await this.fetch<TokenBalance[] | "">(network, params);
    if (!Array.isArray(result)) return [];
    if (type === "all") return result;
    return result.filter((t) => t.tokenType === type);
  }

  async getGasOracle(network: Network = "mainnet"): Promise<GasOracle | null> {
    try {
      return await this.fetch<GasOracle>(network, {
        module: "gastracker",
        action: "gasoracle",
      });
    } catch {
      // gastracker module is not available on all chains (Taiko uses RPC-based gas estimation)
      return null;
    }
  }

  async getTransactionByHash(hash: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, {
      module: "proxy",
      action: "eth_getTransactionByHash",
      txhash: hash,
    });
  }

  async getTransactionReceipt(hash: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, {
      module: "proxy",
      action: "eth_getTransactionReceipt",
      txhash: hash,
    });
  }

  async getBlockByNumber(blockTag: string, network: Network = "mainnet"): Promise<unknown> {
    return this.fetch<unknown>(network, {
      module: "proxy",
      action: "eth_getBlockByNumber",
      tag: blockTag,
      boolean: "true",
    });
  }
}
