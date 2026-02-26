---
name: taiko-node
description: Set up, run, and manage Taiko nodes on Hoodi testnet or Alethia mainnet using Docker or from source. Use when "run node", "node operator", "simple-taiko-node", "taiko-geth", "taiko-client", or "sync" is mentioned.
---

# Taiko Node Operations

Run Taiko Alethia (mainnet) or Hoodi (testnet) nodes. A node has two components: `taiko-geth` (execution engine) and `taiko-client` (consensus client).

> **Network Selection:** Always ask which network if user hasn't specified "hoodi" or "mainnet".

## Networks

| Network | Chain ID | L1 Required | RPC |
|---------|----------|-------------|-----|
| Taiko Alethia | `167000` | Ethereum Mainnet | `https://rpc.mainnet.taiko.xyz` |
| Taiko Hoodi | `167013` | Ethereum Hoodi (560048) | `https://rpc.hoodi.taiko.xyz` |

## Quick Decision Guide

| Task | Resource |
|------|----------|
| Run node (Docker) | [Docker setup](./references/docker-setup.md) |
| Build from source | [Source build](./references/source-build.md) |
| Run Ethereum Hoodi L1 | [eth-docker](https://github.com/ethstaker/eth-docker) |
| Debug issues | [Troubleshooting](./references/node-troubleshooting.md) |

## Prerequisites

- **Hardware:** 16 GB RAM, 2 TB SSD, quad-core CPU
- **Software:** Docker `^24.0`, git `^2` (source builds also need Go `^1.21`, make `^4`)
- **L1 node required** — local strongly recommended (remote RPCs will rate-limit)

## Docker Setup (Recommended)

```bash
git clone https://github.com/taikoxyz/simple-taiko-node.git && cd simple-taiko-node
cp .env.sample .env              # mainnet (.env.sample.hoodi for testnet)
# Edit .env: set L1_ENDPOINT_WS, L1_BEACON_HTTP, COMPOSE_PROFILES
docker compose up -d             # mainnet
docker compose -f docker-compose-hoodi.yml up -d  # testnet
```

**L1 endpoints:** Don't use `127.0.0.1` — use `host.docker.internal` or machine's private IP.

Full guide: [Docker Setup Reference](./references/docker-setup.md)

## P2P and Preconfirmations

Required to receive preconfirmed blocks. Set in `.env`:

```
ENABLE_PRECONFS_P2P=true
PUBLIC_IP=<EXTERNAL_IP>        # curl ifconfig.me
PRIV_RAW=<HEX_KEY>            # unique per node, no funds needed
```

Open firewall: TCP `4001`, UDP `30303`. Verify: `docker compose logs -f | grep "peer tick"` — need `peersLen >= 6` (mainnet) or `>= 3` (testnet).

## Contract Addresses

| | TaikoInbox | TaikoAnchor | Checkpoint Sync |
|-|------------|-------------|-----------------|
| **Alethia** | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` | `0x1670000000000000000000000000000000010001` | `https://rpc.mainnet.taiko.xyz` |
| **Hoodi** | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` | `0x1670130000000000000000000000000000010001` | `https://rpc.hoodi.taiko.xyz` |

## CLI Reference (Docker)

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Update | `git pull origin main && docker compose pull` |
| Remove + data | `docker compose down -v` |
| Logs | `docker compose logs -f` |
| Grafana | `http://localhost:3001/d/L2ExecutionEngine/l2-execution-engine-overview` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Genesis hash mismatch | Wrong compose file — use `-f docker-compose-hoodi.yml` for Hoodi |
| Beacon client not found | Set `L1_BEACON_HTTP` in `.env` |
| No peers | Check `PUBLIC_IP`, firewall ports 4001/tcp + 30303/udp |
| Rate limited | Run local L1 node |
| Incompatible DB | `docker compose down -v` |

Full list: [Troubleshooting Reference](./references/node-troubleshooting.md)

## Resources

- **Docs**: https://docs.taiko.xyz/guides/node-operators/run-a-taiko-alethia-node-with-docker/
- **Releases**: https://github.com/taikoxyz/simple-taiko-node/releases
- **Discord**: https://discord.gg/aGZYtKqMjj
