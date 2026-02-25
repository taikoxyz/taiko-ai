# Taiko Mainnet Network Configuration

## Network Details

### Taiko Alethia (L2)

| Property | Value |
|----------|-------|
| **Network Name** | Taiko Alethia |
| **Chain ID** | `167000` (hex: `0x28c58`) |
| **Symbol** | ETH |
| **RPC URL** | `https://rpc.mainnet.taiko.xyz` |

### Ethereum Mainnet (L1)

| Property | Value |
|----------|-------|
| **Network Name** | Ethereum Mainnet |
| **Chain ID** | `1` (hex: `0x1`) |
| **Symbol** | ETH |
| **RPC Endpoints** | See [chainlist.org/chain/1](https://chainlist.org/chain/1) |

---

## Alternative RPC Endpoints

| Provider | URL |
|----------|-----|
| Taiko (Official) | `https://rpc.mainnet.taiko.xyz` |
| Taiko (Alt) | `https://rpc.taiko.xyz` |
| Ankr | `https://rpc.ankr.com/taiko` |
| dRPC | `https://taiko.drpc.org` |
| PublicNode | `https://taiko-rpc.publicnode.com` |

**Note:** Public RPC endpoints are rate limited. For production use, run your own node or use a third-party RPC provider.

---

## Block Explorers

### Taiko Alethia

| Explorer | URL |
|----------|-----|
| Taikoscan | https://taikoscan.io |
| Blockscout | https://blockscout.mainnet.taiko.xyz |

### Ethereum Mainnet

| Explorer | URL |
|----------|-----|
| Etherscan | https://etherscan.io |
| Beacon Explorer | https://beaconcha.in |

---

## API Endpoints

### Verification APIs

| Service | API URL |
|---------|---------|
| Taikoscan | `https://api.taikoscan.io/api` |
| Taikoscan (v2) | `https://api.etherscan.io/v2/api?chainid=167000` |
| Blockscout | `https://blockscoutapi.mainnet.taiko.xyz/api?` |

### Bridge & Relayer

| Service | URL |
|---------|-----|
| Official Bridge | https://bridge.taiko.xyz |
| Bridge Relayer API | https://relayer.taiko.xyz |

---

## Protocol Parameters

| Parameter | Value |
|-----------|-------|
| Liveness Bond | 125 TAIKO |
| Proving Window | 120 minutes |
| Cooldown | 120 minutes |
| Proof Types | TEE + TEE, TEE + ZK |
| ZK Coverage | 100% |
| Basefee Sharing | 75% |

---

## Gas Configuration

| Parameter | Taiko Alethia | Ethereum |
|-----------|---------------|----------|
| Block Gas Limit | 241,000,000 | 36,000,000 |
| Block Gas Target | 40,000,000 (per L1 block) | 18,000,000 |
| Block Time | ~2-6 seconds | 12 seconds |

---

## Getting ETH on Taiko Alethia

Taiko Alethia is a **mainnet** — real ETH is required.

1. **Acquire ETH** on Ethereum Mainnet
2. **Bridge to Taiko Alethia** via https://bridge.taiko.xyz

**Note:** Bridging back from L2 to L1 takes up to 24 hours due to the cooldown period.

---

## Wallet Configuration

### MetaMask (Taiko Alethia)

```json
{
  "chainId": "0x28c58",
  "chainName": "Taiko Alethia",
  "nativeCurrency": {
    "name": "Ethereum",
    "symbol": "ETH",
    "decimals": 18
  },
  "rpcUrls": ["https://rpc.mainnet.taiko.xyz"],
  "blockExplorerUrls": ["https://taikoscan.io"]
}
```

### Manual Setup

```
Network Name: Taiko Alethia
RPC URL: https://rpc.mainnet.taiko.xyz
Chain ID: 167000
Currency Symbol: ETH
Block Explorer: https://taikoscan.io
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
| Bridge UI | https://bridge.taiko.xyz |
| Code Diff Tool | https://codediff.taiko.xyz |
| Status Page | https://status.taiko.xyz |
| Proof Dashboard | https://proofs.taiko.xyz |
| Protocol Releases | https://github.com/taikoxyz/taiko-mono/releases?q=alethia-protocol |
| L1 Contract Logs | https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L1.md |
| L2 Contract Logs | https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L2.md |
| Discord | https://discord.gg/taikoxyz |
| GitHub | https://github.com/taikoxyz/taiko-mono |

---

## Running a Node

| Guide | URL |
|-------|-----|
| Docker | https://docs.taiko.xyz/guides/node-operators/run-a-taiko-alethia-node-with-docker/ |
| From Source | https://docs.taiko.xyz/guides/node-operators/build-a-taiko-alethia-node-from-source/ |

### Simple Taiko Node

```bash
git clone https://github.com/taikoxyz/simple-taiko-node
cd simple-taiko-node
cp .env.sample .env
# Edit .env with your configuration
docker compose up -d
```
