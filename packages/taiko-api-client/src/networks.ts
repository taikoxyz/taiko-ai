export const NETWORKS = {
  mainnet: {
    chainId: 167000,
    rpc: process.env.TAIKO_MAINNET_RPC ?? "https://rpc.mainnet.taiko.xyz",
    // Etherscan V2 API — all chains now use api.etherscan.io/v2/api?chainid=
    etherscanV2: "https://api.etherscan.io/v2/api",
    blockscout: "https://blockscoutapi.mainnet.taiko.xyz/api/v2",
    relayer: "https://relayer.taiko.xyz",
    bridge: "0x1670000000000000000000000000000000000001",
    signalService: "0x1670000000000000000000000000000000000005",
    anchor: "0x1670000000000000000000000000000000010001",
    erc20Vault: "0x1670000000000000000000000000000000000002",
    taikoscanExplorer: "https://taikoscan.io",
  },
  hoodi: {
    chainId: 167013,
    rpc: process.env.TAIKO_HOODI_RPC ?? "https://rpc.hoodi.taiko.xyz",
    etherscanV2: "https://api.etherscan.io/v2/api",
    blockscout: "https://blockscoutapi.hoodi.taiko.xyz/api/v2",
    relayer: "https://relayer.hoodi.taiko.xyz",
    bridge: "0x167D000000000000000000000000000000000001",
    signalService: "0x167D000000000000000000000000000000000005",
    anchor: "0x1670000000000000000000000000000000010001",
    erc20Vault: "0x167D000000000000000000000000000000000002",
    taikoscanExplorer: "https://hoodi.taikoscan.io",
  },
} as const;

export type Network = keyof typeof NETWORKS;
export type NetworkConfig = (typeof NETWORKS)[Network];
