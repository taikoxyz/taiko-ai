---
name: taiko-node
description: Set up, run, and manage Taiko nodes on Hoodi testnet or Alethia mainnet using Docker or from source. Use when "run node", "node operator", "simple-taiko-node", "taiko-geth", "taiko-client", or "sync" is mentioned.
---

# Taiko Node Operations

Set up and run Taiko Alethia (mainnet) or Hoodi (testnet) nodes. A Taiko node consists of two components — an execution engine (`taiko-geth`) and a consensus client (`taiko-client`) — analogous to an Ethereum node.

> **Network Selection:** If the user has not specified "hoodi" or "mainnet" (Alethia), always ask which network to use before proceeding.

## Node Architecture

| Component | Role | Description |
|-----------|------|-------------|
| **taiko-geth** | Execution Engine | Executes L2 block payloads, holds chain state, exposes JSON-RPC API |
| **taiko-client** | Consensus Client | Decodes L2 blocks from L1 calldata/blobspace, passes payloads to taiko-geth |
| **simple-taiko-node** | Docker Wrapper | Bundles both components with Grafana monitoring |

## Networks

| Network | Type | Chain ID | L1 Required | RPC |
|---------|------|----------|-------------|-----|
| Taiko Alethia | mainnet | `167000` | Ethereum Mainnet | `https://rpc.mainnet.taiko.xyz` |
| Taiko Hoodi | testnet | `167013` | Ethereum Hoodi (560048) | `https://rpc.hoodi.taiko.xyz` |

## Quick Decision Guide

| Task | Approach |
|------|----------|
| Run a node quickly | [Docker setup](./references/docker-setup.md) with simple-taiko-node |
| Custom architecture / inspect source | [Build from source](./references/source-build.md) |
| Run an Ethereum Hoodi L1 node | Use [eth-docker](https://github.com/ethstaker/eth-docker) |
| Debug node issues | [Troubleshooting guide](./references/node-troubleshooting.md) |
| Enable preconfirmations | Configure P2P settings (see below) |
| Monitor node | Grafana dashboard at `localhost:3001` |

## Prerequisites

### Hardware Requirements

- 16 GB RAM
- 2 TB SSD (plan for growth)
- Quad-core CPU

### Software Dependencies

| Dependency | Version | For |
|------------|---------|-----|
| [Docker](https://docs.docker.com/engine/install/) | `^24.0` | Docker setup |
| [git](https://git-scm.com/) | `^2` | Both methods |
| [Go](https://go.dev/) | `^1.21` | Source build only |
| [make](https://www.gnu.org/software/make/) | `^4` | Source build only |

### L1 Node Requirement

A Taiko node requires an L1 Ethereum node to sync from:
- **Alethia mainnet** → Ethereum Mainnet node
- **Hoodi testnet** → Ethereum Hoodi testnet node

A **local L1 node is strongly recommended**. Remote RPC providers will eventually rate-limit your node and it will stop syncing. For Hoodi L1, use [eth-docker](https://github.com/ethstaker/eth-docker).

> **Fusaka Note (Hoodi):** After the Fusaka upgrade on Ethereum Hoodi, beacon clients must run as semi-supernode or supernode to avoid blob unavailability. Configure your beacon client:
> - Lighthouse: `--semi-supernode` or `--supernode`
> - Teku: `--p2p-subscribe-all-custody-subnets-enabled`
> - Grandine: `--subscribe-all-data-column-subnets`
> - Lodestar: `--supernode`
> - Nimbus: `--debug-peerdas-supernode`

## Docker Setup (Recommended)

Full guide: [Docker Setup Reference](./references/docker-setup.md)

```bash
# 1. Clone simple-taiko-node
git clone https://github.com/taikoxyz/simple-taiko-node.git
cd simple-taiko-node

# 2. Copy env file
cp .env.sample .env              # Alethia mainnet
# cp .env.sample.hoodi .env      # Hoodi testnet

# 3. Edit .env — set L1 endpoints
# L1_ENDPOINT_WS=ws://<YOUR_L1_IP>:8546
# L1_BEACON_HTTP=http://<YOUR_L1_IP>:5052

# 4. Set COMPOSE_PROFILES (e.g., l2_execution_engine)
# COMPOSE_PROFILES=l2_execution_engine

# 5. Start the node
docker compose up -d                                    # Alethia mainnet
# docker compose -f docker-compose-hoodi.yml up -d      # Hoodi testnet
```

### Verify Node Is Running

```bash
# Check chain ID (should return 0x28c58 for Alethia, 0x28c65 for Hoodi)
curl -s http://localhost:8547 -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'

# Check current block
curl -s http://localhost:8547 -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'

# View logs
docker compose logs -f
```

### Grafana Dashboard

Access at `http://localhost:3001/d/L2ExecutionEngine/l2-execution-engine-overview` (default port `3001`, configurable via `GRAFANA_PORT` in `.env`).

## P2P and Preconfirmations

To receive preconfirmed blocks and keep up with the tip of the chain:

1. **Enable P2P:** Set `ENABLE_PRECONFS_P2P=true` in `.env`
2. **Set external IP:** Set `PUBLIC_IP=<YOUR_EXTERNAL_IP>` in `.env`
   - Find with `curl ifconfig.me`
   - Must be publicly accessible from the internet
3. **Open firewall ports:**
   - TCP `4001` (or custom `P2P_TCP_PORT`)
   - UDP `30303` (or custom `P2P_UDP_PORT`)
4. **Set peer identity key:** Set `PRIV_RAW=<HEX_PRIVATE_KEY>` in `.env`
   - Unique per node
   - Does NOT need to hold funds — only used for peer ID

### Verify P2P Connectivity

Check logs for `peer tick`:
```bash
docker compose logs -f | grep "peer tick"
# Look for: peersLen=X — should be >= 6 (Alethia) or >= 3 (Hoodi)
```

## Build from Source

Full guide: [Source Build Reference](./references/source-build.md)

### Build taiko-geth
```bash
git clone https://github.com/taikoxyz/taiko-geth.git
cd taiko-geth
git checkout <release-tag>    # Check https://github.com/taikoxyz/taiko-geth/releases
make geth
```

### Build taiko-client
```bash
git clone https://github.com/taikoxyz/taiko-mono.git
cd taiko-mono/packages/taiko-client
git checkout <release-tag>    # Check https://github.com/taikoxyz/taiko-mono/releases
make build
```

### Run from Source

```bash
# 1. Generate JWT secret
openssl rand -hex 32 > jwt.txt

# 2. Start taiko-geth (start before taiko-client)
./build/bin/geth --taiko --networkid <CHAIN_ID> --gcmode archive \
  --datadir ./data/taiko-geth --authrpc.jwtsecret ./jwt.txt \
  --http --http.port 28545 --ws --ws.port 28546 \
  --authrpc.port 28551 --syncmode full --state.scheme=path

# 3. Start taiko-client
export L1_WS=ws://<L1_ENDPOINT>:8546
export L1_BEACON_URL=http://<L1_BEACON>:5052
./bin/taiko-client driver \
  --l1.ws $L1_WS --l1.beacon $L1_BEACON_URL \
  --l2.ws ws://localhost:28546 --l2.auth http://localhost:28551 \
  --taikoInbox <INBOX_ADDR> --taikoAnchor <ANCHOR_ADDR> \
  --jwtSecret ./jwt.txt --p2p.sync \
  --p2p.checkPointSyncUrl <CHECKPOINT_URL>
```

See [Source Build Reference](./references/source-build.md) for full commands with all flags per network.

## CLI Reference (Docker)

| Action | Command |
|--------|---------|
| Start node | `docker compose up -d` |
| Stop node | `docker compose down` |
| Restart node | `docker compose down && docker compose up -d` |
| Update node | `git pull origin main && docker compose pull` |
| Remove node + data | `docker compose down -v` |
| View all logs | `docker compose logs -f` |
| View execution logs | `docker compose logs -f l2_execution_engine` |
| View driver logs | `docker compose logs -f taiko_client_driver` |
| View proposer logs | `docker compose logs -f taiko_client_proposer` |
| View resource usage | `docker stats` |
| Open Grafana | `open http://localhost:3001/d/L2ExecutionEngine/l2-execution-engine-overview` |
| Compare env files | `sdiff .env .env.sample` |

## Contract Addresses

### Alethia Mainnet

| Contract | Address |
|----------|---------|
| TaikoInbox | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` |
| TaikoAnchor | `0x1670000000000000000000000000000000010001` |
| Preconf Whitelist | `0xFD019460881e6EeC632258222393d5821029b2ac` |
| Checkpoint Sync | `https://rpc.mainnet.taiko.xyz` |

### Hoodi Testnet

| Contract | Address |
|----------|---------|
| TaikoInbox | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` |
| TaikoAnchor | `0x1670130000000000000000000000000000010001` |
| Preconf Whitelist | `0x83AE31678B9f255346Af4636B4726A84c3bD2886` |
| Checkpoint Sync | `https://rpc.hoodi.taiko.xyz` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Genesis hash mismatch | Use correct compose file: `-f docker-compose-hoodi.yml` for Hoodi |
| Beacon client not found | Set `L1_BEACON_HTTP` in `.env` |
| No peers / not syncing | Check P2P config: `PUBLIC_IP`, ports `4001/tcp` and `30303/udp` |
| Rate limited by L1 RPC | Run your own local L1 node |
| Database incompatible genesis | `docker compose down -v` to remove old volumes |
| Connection refused | Check firewall: `sudo ufw status` |
| SIGILL in blst_cgo_init | Set `CGO_CFLAGS="-O -D__BLST_PORTABLE__"` |
| Port already allocated | Change conflicting port in `.env` or stop other service |
| No service selected | Update simple-taiko-node; set `COMPOSE_PROFILES` in `.env` |

See [Troubleshooting Reference](./references/node-troubleshooting.md) for detailed error analysis.

## Software Releases

Always use the latest versions:

| Package | Releases |
|---------|----------|
| simple-taiko-node | https://github.com/taikoxyz/simple-taiko-node/releases |
| taiko-geth | https://github.com/taikoxyz/taiko-geth/releases |
| taiko-client | https://github.com/taikoxyz/taiko-mono/releases?q=taiko-alethia-client |
| protocol | https://github.com/taikoxyz/taiko-mono/releases?q=taiko-alethia-protocol |

## Resources

- **Node Docs**: https://docs.taiko.xyz/guides/node-operators/run-a-taiko-alethia-node-with-docker/
- **Status**: https://status.taiko.xyz
- **Discord**: https://discord.gg/aGZYtKqMjj (for node operator support)
- **eth-docker (Hoodi L1)**: https://github.com/ethstaker/eth-docker
