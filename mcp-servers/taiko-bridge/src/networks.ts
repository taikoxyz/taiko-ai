import { defineChain } from "viem";
import { NETWORKS } from "@taikoxyz/taiko-api-client";

// L1 chains (Ethereum)
export const ethereumMainnet = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.TAIKO_L1_MAINNET_RPC ?? "https://eth.drpc.org"],
    },
  },
});

export const hoodiTestnet = defineChain({
  id: 560048,
  name: "Ethereum Hoodi Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.TAIKO_L1_HOODI_RPC ?? "https://hoodi.drpc.org"],
    },
  },
});

// L2 chains (Taiko)
export const taikoMainnet = defineChain({
  id: 167000,
  name: "Taiko Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [NETWORKS.mainnet.rpc],
    },
  },
});

export const taikoHoodi = defineChain({
  id: 167013,
  name: "Taiko Hoodi",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [NETWORKS.hoodi.rpc],
    },
  },
});

export type TaikoNetwork = "mainnet" | "hoodi";
export type BridgeDirection = "L1_TO_L2" | "L2_TO_L1";

export const BRIDGE_CONTRACTS = {
  mainnet: {
    // L1 Bridge on Ethereum mainnet (source: taikoxyz/taiko-mono mainnet-contract-logs-L1.md)
    l1Bridge: "0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC" as `0x${string}`,
    // L2 contracts on Taiko mainnet
    l2Bridge: NETWORKS.mainnet.bridge,
    l2ERC20Vault: NETWORKS.mainnet.erc20Vault,
    l1Chain: ethereumMainnet,
    l2Chain: taikoMainnet,
    destChainIds: { L1_TO_L2: 167000n, L2_TO_L1: 1n } as const,
  },
  hoodi: {
    // L1 Bridge on Hoodi testnet (source: taikoxyz/taiko-mono taiko-hoodi-contract-logs.md)
    l1Bridge: "0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80" as `0x${string}`,
    l2Bridge: NETWORKS.hoodi.bridge,
    l2ERC20Vault: NETWORKS.hoodi.erc20Vault,
    l1Chain: hoodiTestnet,
    l2Chain: taikoHoodi,
    destChainIds: { L1_TO_L2: 167013n, L2_TO_L1: 560048n } as const,
  },
} as const;

/** Default gas limits for bridge operations (from Taiko relayer source). */
export const DEFAULT_GAS_LIMITS = {
  eth: 900000,
  erc20Deployed: 1000000,
  erc20NotDeployed: 1650000,
} as const;
