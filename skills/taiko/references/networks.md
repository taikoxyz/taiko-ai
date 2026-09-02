# Networks

Taiko Mainnet (formerly known as Alethia) and Taiko Hoodi testnet configuration.

Sources: [`MainnetL1Addrs.sol`](../assets/foundry-template/src/MainnetL1Addrs.sol), [`MainnetL2Addrs.sol`](../assets/foundry-template/src/MainnetL2Addrs.sol), [`HoodiL1Addrs.sol`](../assets/foundry-template/src/HoodiL1Addrs.sol), [`HoodiL2Addrs.sol`](../assets/foundry-template/src/HoodiL2Addrs.sol)

## Overview

| | Taiko Mainnet | Taiko Hoodi |
|-|---------------|-------------|
| Type | mainnet | testnet |
| Chain ID | `167000` (hex: `0x28c58`) | `167013` (hex: `0x28c65`) |
| L1 | Ethereum Mainnet (chain ID `1`) | Ethereum Hoodi (chain ID `560048`) |
| RPC | `https://rpc.mainnet.taiko.xyz` | `https://rpc.hoodi.taiko.xyz` |
| Taikoscan | https://taikoscan.io | https://hoodi.taikoscan.io |
| Bridge | https://bridge.taiko.xyz | https://bridge.hoodi.taiko.xyz |
| EVM Version | Osaka | Osaka |
| Currency | ETH | ETH |

## API Endpoints

| | Mainnet | Hoodi |
|-|---------|-------|
| Taikoscan API | `https://api.taikoscan.io/api` | `https://api-hoodi.taikoscan.io/api` |
| Relayer | https://relayer.mainnet.taiko.xyz | https://relayer.hoodi.taiko.xyz |

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
| **Hoodi** | `0xeF4bB7A442Bd68150A3aa61A6a097B86b91700BF` | `0x1670130000000000000000000000000000010001` | `0x8B969Fcf37122bC5eCB4E0e5Ad65CEEC3f1393ba` | `https://rpc.hoodi.taiko.xyz` |

## Protocol Parameters

Shasta inbox configuration. Both networks run the same parameters.

| Parameter | Mainnet | Hoodi |
|-----------|---------|-------|
| Liveness Bond | 0 TAIKO | 0 TAIKO |
| Min Bond | 0 TAIKO | 0 TAIKO |
| Proving Window | 4 hours | 4 hours |
| Permissionless Proving Delay | 5 days | 5 days |
| Max Proof Submission Delay | 3 min | 3 min |
| Bond Withdrawal Delay | 7 days | 7 days |
| Forced Inclusion Delay | 576 s | 576 s |
| Basefee Sharing | 75% | 75% |
| Proof Types | TEE + TEE, TEE + ZK | TEE + TEE, TEE + ZK |
| Block Gas Limit | 46,000,000 | 46,000,000 |
| Block Time | ~2s | ~1s |

Bonds are zero while the prover whitelist is in force. Read the live values from the inbox
with `getConfig()` rather than relying on this table.

Mainnet L2→L1 bridging takes up to 24 hours.

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
