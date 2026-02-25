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

Core L1/L2 protocol addresses (Bridge, Vaults, SignalService, Inbox, etc.) are defined in [`HoodiAddresses.sol`](../assets/foundry-template/src/HoodiAddresses.sol).

### Additional L1 Contracts (Ethereum Hoodi — 560048)

| Contract | Address |
|----------|---------|
| Inbox (PacayaInbox) | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` |
| Taiko Wrapper | `0xB843132A26C13D751470a6bAf5F926EbF5d0E4b8` |
| Rollup Address Resolver | `0x0d006d8d394dD69fAfEfF62D21Fc03E7F50eDaF4` |
| Prover Whitelist | `0xa9a84b6667A2c60BFdE8c239918d0d9a11c77E89` |
| Preconf Router | `0xCD15bdEc91BbD45E56D81b4b76d4f97f5a84e555` |
| BridgedERC20 | `0xcF954A2f0346e3aD0d0119989CEdB253D8c3428B` |
| BridgedERC721 | `0x1f81E8503bf2Fe8F44053261ad5976C255455034` |
| BridgedERC1155 | `0xd763f72F20F62f6368D6a20bdeaE8f4A325f83c1` |
| Proof Verifier (Compose) | `0xd9F11261AE4B873bE0f09D0Fc41d2E3F70CD8C59` |
| SGX Reth | `0xd46c13B67396cD1e74Bb40e298fbABeA7DC01f11` |
| SGX Geth | `0xCdBB6C1751413e78a40735b6D9Aaa7D55e8c038e` |
| RISC0 Reth | `0xbf285Dd2FD56BF4893D207Fba4c738D1029edFfd` |
| SP1 Reth | `0x3B3bb4A1Cb8B1A0D65F96a5A93415375C039Eda3` |

### Additional L2 Contracts (Taiko Hoodi — 167013)

| Contract | Address |
|----------|---------|
| BridgedERC20 (impl) | `0x0167013000000000000000000000000000010096` |
| BridgedERC721 (impl) | `0x0167013000000000000000000000000000010097` |
| BridgedERC1155 (impl) | `0x0167013000000000000000000000000000010098` |
| Multicall3 | `0xca11bde05977b3631167028862be2a173976ca11` |
| Safe Singleton Factory | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |

### Test Tokens

| Token | L1 Address |
|-------|------------|
| HorseToken | `0x0a5Db5597ADC81c871Ebd89e81cfa07bDc8fAfE3` |
| BullToken | `0xB7A4DE1200eaA20af19e4998281117497645ecC1` |

### Preconf Proposers (Whitelisted)

| Operator | Address |
|----------|---------|
| Taiko Nethermind | `0x75141CD01F50A17a915d59D245aE6B2c947D37d9` |
| Taiko Chainbound | `0x205a600D515091b473b6c1A8477D967533D10749` |
| Taiko Gattaca | `0x445179507C3b0B84ccA739398966236a35ad8Ea1` |

### Whitelisted Prover

| Operator | Address |
|----------|---------|
| Taiko Prover | `0x7B399987D24FC5951f3E94A4cb16E87414bF2229` |

## Ownership

| Role | Address |
|------|---------|
| L1 Owner | `0x1D2D1bb9D180541E88a6a682aCf3f61c1605B190` |
| L2 Owner | `0xF7176c3aC622be8bab1B839b113230396E6877ab` (DelegateController) |

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
