# Taiko Hoodi Network Configuration

## Network Details

### Taiko Hoodi (L2)

| Property | Value |
|----------|-------|
| **Network Name** | Taiko Hoodi |
| **Chain ID** | `167013` (hex: `0x28c65`) |
| **Symbol** | ETH |
| **RPC URL** | `https://rpc.hoodi.taiko.xyz` |

### Ethereum Hoodi (L1)

| Property | Value |
|----------|-------|
| **Network Name** | Ethereum Hoodi |
| **Chain ID** | `560048` (hex: `0x88bb0`) |
| **Symbol** | ETH |
| **RPC Endpoints** | See [chainlist.org/chain/560048](https://chainlist.org/chain/560048) |

---

## Block Explorers

### Taiko Hoodi

| Explorer | URL |
|----------|-----|
| Taikoscan | https://hoodi.taikoscan.io |
| Blockscout | https://blockscout.hoodi.taiko.xyz |

### Ethereum Hoodi

| Explorer | URL |
|----------|-----|
| Etherscan | https://hoodi.etherscan.io |
| Beacon Explorer | https://hoodi.beaconcha.in |

---

## API Endpoints

### Verification APIs

| Service | API URL |
|---------|---------|
| Taikoscan | `https://api-hoodi.taikoscan.io/api` |
| Taikoscan (v2) | `https://api.etherscan.io/v2/api?chainid=167013` |
| Blockscout | `https://blockscoutapi.hoodi.taiko.xyz/api/v2/` |

### Bridge & Relayer

| Service | URL |
|---------|-----|
| Official Bridge | https://bridge.hoodi.taiko.xyz |
| Bridge Relayer API | https://relayer.hoodi.taiko.xyz |

---

## Protocol Parameters (v3.0.0)

| Parameter | Value |
|-----------|-------|
| Liveness Bond | 0 TAIKO |
| Min Bond | 0 TAIKO |
| Proving Window | 4 hours |
| Permissionless Proving Delay | 5 days |
| Max Proof Submission Delay | 3 minutes |
| Withdrawal Delay | 1 week |
| Forced Inclusion Delay | 576 seconds |
| Forced Inclusion Fee | 0.001 ETH |
| Basefee Sharing | 75% |
| Ring Buffer Size | 21,600 |
| Proof Types | TEE + TEE, TEE + ZK |

---

## Gas Configuration

| Parameter | Taiko Hoodi | Ethereum |
|-----------|-------------|----------|
| Block Gas Limit | 241,000,000 | 36,000,000 |
| Block Gas Target | 40,000,000 (per L1 block) | 18,000,000 |
| Block Time | ~2-6 seconds | 12 seconds |

---

## Getting Test ETH

### Ethereum Hoodi (L1) Faucets

| Faucet | URL | Notes |
|--------|-----|-------|
| ETHPandaOps | https://hoodi.ethpandaops.io | Official Hoodi faucet |
| Google Cloud | https://cloud.google.com/application/web3/faucet/ethereum/hoodi | No signup |
| Chainlink | https://faucets.chain.link/hoodi | Multiple assets |
| QuickNode | https://faucet.quicknode.com/ethereum/hoodi | 1 drip per 12 hours |
| Stakely | https://stakely.io/faucet/ethereum-hoodi-testnet-eth | Requires Twitter |
| Automata | https://www.hoodifaucet.io | No signup |

### Taiko Hoodi (L2)

1. Get ETH on Ethereum Hoodi using faucets above
2. Bridge to Taiko Hoodi via https://bridge.hoodi.taiko.xyz

### Test Tokens

| Token | L1 Address | Notes |
|-------|------------|-------|
| HORSE | `0x0a5Db5597ADC81c871Ebd89e81cfa07bDc8fAfE3` | Faucet at bridge UI |
| BULL | `0xB7A4DE1200eaA20af19e4998281117497645ecC1` | Test ERC20 |

---

## Wallet Configuration

### MetaMask (Taiko Hoodi)

```json
{
  "chainId": "0x28c65",
  "chainName": "Taiko Hoodi",
  "nativeCurrency": {
    "name": "Ethereum",
    "symbol": "ETH",
    "decimals": 18
  },
  "rpcUrls": ["https://rpc.hoodi.taiko.xyz"],
  "blockExplorerUrls": ["https://hoodi.taikoscan.io"]
}
```

### Manual Setup

```
Network Name: Taiko Hoodi
RPC URL: https://rpc.hoodi.taiko.xyz
Chain ID: 167013
Currency Symbol: ETH
Block Explorer: https://hoodi.taikoscan.io
```

---

## EVM Compatibility

| Property | Value |
|----------|-------|
| ZK-EVM Type | Type-1 (fully Ethereum-equivalent) |
| EVM Version | Shanghai |
| Supported Opcodes | All standard EVM opcodes |
| Precompiles | All Ethereum precompiles |

---

## Development Resources

| Resource | URL |
|----------|-----|
| Official Docs | https://docs.taiko.xyz |
| Bridge UI | https://bridge.hoodi.taiko.xyz |
| Code Diff Tool | https://codediff.taiko.xyz |
| Status Page | https://status.taiko.xyz |
| Protocol Releases | https://github.com/taikoxyz/taiko-mono/releases?q=alethia-protocol |
| Contract Logs | https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md |
| Discord | https://discord.gg/taikoxyz |
| GitHub | https://github.com/taikoxyz/taiko-mono |

---

## Running a Node

| Guide | URL |
|-------|-----|
| Docker | https://docs.taiko.xyz/guides/node-operators/run-a-taiko-alethia-node-with-docker/ |
| From Source | https://docs.taiko.xyz/guides/node-operators/build-a-taiko-alethia-node-from-source/ |
| Hoodi-Specific | https://docs.taiko.xyz/guides/node-operators/run-a-node-for-taiko-hoodi/ |

### Simple Taiko Node

```bash
git clone https://github.com/taikoxyz/simple-taiko-node
cd simple-taiko-node
cp .env.sample.hoodi .env
# Edit .env with your configuration
docker compose up -d
```
