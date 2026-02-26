# Networks

Taiko Mainnet (formerly known as Alethia) and Taiko Hoodi testnet configuration.

Sources: [mainnet-contract-logs-L1.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L1.md), [mainnet-contract-logs-L2.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L2.md), [taiko-hoodi-contract-logs.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md)

## Overview

| | Taiko Mainnet | Taiko Hoodi |
|-|---------------|-------------|
| Type | mainnet | testnet |
| Chain ID | `167000` (hex: `0x28c58`) | `167013` (hex: `0x28c65`) |
| L1 | Ethereum Mainnet (chain ID `1`) | Ethereum Hoodi (chain ID `560048`) |
| RPC | `https://rpc.mainnet.taiko.xyz` | `https://rpc.hoodi.taiko.xyz` |
| Taikoscan | https://taikoscan.io | https://hoodi.taikoscan.io |
| Blockscout | https://blockscout.mainnet.taiko.xyz | https://blockscout.hoodi.taiko.xyz |
| Bridge | https://bridge.taiko.xyz | https://bridge.hoodi.taiko.xyz |
| EVM Version | Shanghai | Shanghai |
| Currency | ETH | ETH |

## API Endpoints

| | Mainnet | Hoodi |
|-|---------|-------|
| Taikoscan API | `https://api.taikoscan.io/api` | `https://api-hoodi.taikoscan.io/api` |
| Blockscout API | `https://blockscoutapi.mainnet.taiko.xyz/api?` | `https://blockscoutapi.hoodi.taiko.xyz/api/v2/` |
| Relayer | https://relayer.taiko.xyz | https://relayer.hoodi.taiko.xyz |

### Alternative Mainnet RPC Endpoints

| Provider | URL |
|----------|-----|
| Ankr | `https://rpc.ankr.com/taiko` |
| dRPC | `https://taiko.drpc.org` |
| PublicNode | `https://taiko-rpc.publicnode.com` |

## Contract Addresses (Solidity Libraries)

- Mainnet L1: [`MainnetL1Addrs.sol`](../assets/foundry-template/src/MainnetL1Addrs.sol)
- Mainnet L2: [`MainnetL2Addrs.sol`](../assets/foundry-template/src/MainnetL2Addrs.sol)
- Hoodi L1: [`HoodiL1Addrs.sol`](../assets/foundry-template/src/HoodiL1Addrs.sol)
- Hoodi L2: [`HoodiL2Addrs.sol`](../assets/foundry-template/src/HoodiL2Addrs.sol)

L2 predefined addresses follow the pattern `0x{chainId}...0001` (Bridge), `...0005` (SignalService), `...10001` (TaikoAnchor).

## Node Operator Contracts

| | TaikoInbox | TaikoAnchor | Preconf Whitelist | Checkpoint Sync |
|-|------------|-------------|-------------------|-----------------|
| **Mainnet** | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` | `0x1670000000000000000000000000000000010001` | `0xFD019460881e6EeC632258222393d5821029b2ac` | `https://rpc.mainnet.taiko.xyz` |
| **Hoodi** | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` | `0x1670130000000000000000000000000000010001` | `0x83AE31678B9f255346Af4636B4726A84c3bD2886` | `https://rpc.hoodi.taiko.xyz` |

## Protocol Parameters

| Parameter | Mainnet | Hoodi |
|-----------|---------|-------|
| Liveness Bond | 125 TAIKO | 0 TAIKO |
| Proving Window | 120 min | 4 hours |
| Cooldown | 120 min | — |
| Proof Types | TEE + TEE, TEE + ZK | TEE + TEE, TEE + ZK |
| ZK Coverage | 100% | — |
| Basefee Sharing | 75% | 75% |
| Block Gas Limit | 241,000,000 | 241,000,000 |
| Block Time | ~2–6s | ~2–6s |

Mainnet L2→L1 bridging takes up to 24 hours (cooldown period).

## Node Setup (Docker)

| | Mainnet | Hoodi |
|-|---------|-------|
| Env file | `cp .env.sample .env` | `cp .env.sample.hoodi .env` |
| Start | `docker compose up -d` | `docker compose -f docker-compose-hoodi.yml up -d` |
| P2P min peers | >= 6 | >= 3 |

Repo: https://github.com/taikoxyz/simple-taiko-node

## Wallet Config

**Mainnet:**
```
Network Name: Taiko Mainnet
RPC URL: https://rpc.mainnet.taiko.xyz
Chain ID: 167000
Currency: ETH
Explorer: https://taikoscan.io
```

**Hoodi:**
```
Network Name: Taiko Hoodi
RPC URL: https://rpc.hoodi.taiko.xyz
Chain ID: 167013
Currency: ETH
Explorer: https://hoodi.taikoscan.io
```

## Hoodi Faucets (Ethereum Hoodi L1)

| Faucet | URL |
|--------|-----|
| Google Cloud | https://cloud.google.com/application/web3/faucet/ethereum/hoodi |
| Chainlink | https://faucets.chain.link/hoodi |
| QuickNode | https://faucet.quicknode.com/ethereum/hoodi |
| ETHPandaOps | https://hoodi.ethpandaops.io |
| Stakely | https://stakely.io/faucet/ethereum-hoodi-testnet-eth |
| Automata | https://www.hoodifaucet.io |

Then bridge to Taiko Hoodi via https://bridge.hoodi.taiko.xyz

## Foundry Config

```toml
[rpc_endpoints]
taiko-mainnet = "https://rpc.mainnet.taiko.xyz"
taiko-hoodi = "https://rpc.hoodi.taiko.xyz"

[etherscan]
taiko-mainnet = { key = "${TAIKOSCAN_API_KEY}", url = "https://api.taikoscan.io/api", chain = 167000 }
taiko-hoodi = { key = "${TAIKOSCAN_API_KEY}", url = "https://api-hoodi.taikoscan.io/api", chain = 167013 }
```
