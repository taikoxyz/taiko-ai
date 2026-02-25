# Taiko Hoodi (Testnet)

Source: [taiko-hoodi-contract-logs.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md)

## Network Config

| Property | Value |
|----------|-------|
| Network Name | Taiko Hoodi |
| Chain ID | `167013` (hex: `0x28c65`) |
| RPC | `https://rpc.hoodi.taiko.xyz` |
| L1 | Ethereum Hoodi (chain ID `560048`) |
| Taikoscan | https://hoodi.taikoscan.io |
| Blockscout | https://blockscout.hoodi.taiko.xyz |
| Taikoscan API | `https://api-hoodi.taikoscan.io/api` |
| Blockscout API | `https://blockscoutapi.hoodi.taiko.xyz/api/v2/` |
| Bridge | https://bridge.hoodi.taiko.xyz |
| Relayer API | https://relayer.hoodi.taiko.xyz |

## Contract Addresses

- L1 (Ethereum Hoodi): [`HoodiL1Addrs.sol`](../assets/foundry-template/src/HoodiL1Addrs.sol)
- L2 (Taiko Hoodi): [`HoodiL2Addrs.sol`](../assets/foundry-template/src/HoodiL2Addrs.sol)

## Protocol Parameters

| Parameter | Value |
|-----------|-------|
| Liveness Bond | 0 TAIKO |
| Proving Window | 4 hours |
| Permissionless Proving Delay | 5 days |
| Max Proof Submission Delay | 3 minutes |
| Withdrawal Delay | 1 week |
| Forced Inclusion Delay | 576 seconds |
| Forced Inclusion Fee | 0.001 ETH |
| Proof Types | TEE + TEE, TEE + ZK |
| Basefee Sharing | 75% |
| Block Gas Limit | 241,000,000 |
| Block Gas Target | 40,000,000 (per L1 block) |
| Block Time | ~2-6 seconds |

## Faucets (Ethereum Hoodi L1)

| Faucet | URL |
|--------|-----|
| Google Cloud | https://cloud.google.com/application/web3/faucet/ethereum/hoodi |
| Chainlink | https://faucets.chain.link/hoodi |
| QuickNode | https://faucet.quicknode.com/ethereum/hoodi |
| ETHPandaOps | https://hoodi.ethpandaops.io |
| Stakely | https://stakely.io/faucet/ethereum-hoodi-testnet-eth |
| Automata | https://www.hoodifaucet.io |

Then bridge to Taiko Hoodi via https://bridge.hoodi.taiko.xyz

## Wallet Config

```
Network Name: Taiko Hoodi
RPC URL: https://rpc.hoodi.taiko.xyz
Chain ID: 167013
Currency: ETH
Explorer: https://hoodi.taikoscan.io
```

## Node

```bash
git clone https://github.com/taikoxyz/simple-taiko-node
cd simple-taiko-node
cp .env.sample.hoodi .env
docker compose up -d
```
