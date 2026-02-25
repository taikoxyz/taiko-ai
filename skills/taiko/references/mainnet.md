# Taiko Alethia (Mainnet)

Source: [mainnet-contract-logs-L1.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L1.md) and [mainnet-contract-logs-L2.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L2.md)

## Network Config

| Property | Value |
|----------|-------|
| Network Name | Taiko Alethia |
| Chain ID | `167000` (hex: `0x28c58`) |
| RPC | `https://rpc.mainnet.taiko.xyz` |
| L1 | Ethereum Mainnet (chain ID `1`) |
| Taikoscan | https://taikoscan.io |
| Blockscout | https://blockscout.mainnet.taiko.xyz |
| Taikoscan API | `https://api.taikoscan.io/api` |
| Blockscout API | `https://blockscoutapi.mainnet.taiko.xyz/api?` |
| Bridge | https://bridge.taiko.xyz |
| Relayer API | https://relayer.taiko.xyz |

### Alternative RPC Endpoints

| Provider | URL |
|----------|-----|
| Ankr | `https://rpc.ankr.com/taiko` |
| dRPC | `https://taiko.drpc.org` |
| PublicNode | `https://taiko-rpc.publicnode.com` |

## Contract Addresses

Core L1/L2 protocol addresses (Bridge, Vaults, SignalService, Inbox, etc.) are defined in [`MainnetAddresses.sol`](../assets/foundry-template/src/MainnetAddresses.sol).

### Additional L1 Contracts (Ethereum Mainnet — 1)

| Contract | Address |
|----------|---------|
| Taiko Wrapper | `0x9F9D2fC7abe74C79f86F0D1212107692430eef72` |
| Rollup Address Resolver | `0x5A982Fb1818c22744f5d7D36D0C4c9f61937b33a` |
| Preconf Router | `0xD5AA0e20e8A6e9b04F080Cf8797410fafAa9688a` |
| QuotaManager | `0x91f67118DD47d502B1f0C354D0611997B022f29E` |
| BridgedERC20 | `0x65666141a541423606365123Ed280AB16a09A2e1` |
| BridgedERC721 | `0xC3310905E2BC9Cfb198695B75EF3e5B69C6A1Bf7` |
| BridgedERC1155 | `0x3c90963cFBa436400B0F9C46Aa9224cB379c2c40` |
| Proof Verifier (Compose) | `0xB16931e78d0cE3c9298bbEEf3b5e2276D34b8da1` |
| SGX Reth | `0x9e322fC59b8f4A29e6b25c3a166ac1892AA30136` |
| SGX Geth | `0x7e6409e9b6c5e2064064a6cC994f9a2e95680782` |
| RISC0 Reth | `0x73Ee496dA20e5C65340c040B0D8c3C891C1f74AE` |
| SP1 Reth | `0xbee1040D0Aab17AE19454384904525aE4A3602B9` |

### Additional L2 Contracts (Taiko Alethia — 167000)

| Contract | Address |
|----------|---------|
| USDC (Native) | `0x07d83526730c7438048D55A4fc0b850e2aaB6f0b` |
| WETH | `0xA51894664A773981C6C112C43ce576f315d5b1B6` |
| SharedResolver (Pacaya) | `0xc32277f541bBADAA260337E71Cea53871D310DC8` |
| RollupResolver (Pacaya) | `0x73251237d8F1B99e9966bB054722F3446195Ea56` |
| Multicall3 | `0xca11bde05977b3631167028862be2a173976ca11` |
| Safe Singleton Factory | `0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7` |

### Notable L1 External Tokens

| Token | Address |
|-------|---------|
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |

## Ownership

| Role | Address |
|------|---------|
| L1 Owner (Taiko DAO) | `0x9CDf589C941ee81D75F34d3755671d614f7cf261` |
| L2 Owner (DelegateController) | `0xfA06E15B8b4c5BF3FC5d9cfD083d45c53Cbe8C7C` |
| L2 Admin | `0xCa5b76Cc7A38b86Db11E5aE5B1fc9740c3bA3DE8` |

## Protocol Parameters

| Parameter | Value |
|-----------|-------|
| Liveness Bond | 125 TAIKO |
| Proving Window | 120 minutes |
| Cooldown | 120 minutes |
| Proof Types | TEE + TEE, TEE + ZK |
| ZK Coverage | 100% |
| Basefee Sharing | 75% |
| Block Gas Limit | 241,000,000 |
| Block Time | ~2-6 seconds |

**Note:** Bridging L2→L1 takes up to 24 hours due to the cooldown period.

## Wallet Config

```
Network Name: Taiko, Taiko Mainnet, or Taiko Alethia
RPC URL: https://rpc.mainnet.taiko.xyz
Chain ID: 167000
Currency: ETH
Explorer: https://taikoscan.io
```

## Node

```bash
git clone https://github.com/taikoxyz/simple-taiko-node
cd simple-taiko-node
cp .env.sample .env
docker compose up -d
```
