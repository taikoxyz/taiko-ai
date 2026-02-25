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

- L1 (Ethereum Mainnet): [`MainnetL1Addrs.sol`](../assets/foundry-template/src/MainnetL1Addrs.sol)
- L2 (Taiko Alethia): [`MainnetL2Addrs.sol`](../assets/foundry-template/src/MainnetL2Addrs.sol)

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
