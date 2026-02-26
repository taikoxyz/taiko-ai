---
name: taiko-node
description: Set up, run, and manage Taiko nodes on Hoodi testnet or mainnet using Docker or from source. Use when "run node", "node operator", "simple-taiko-node", "taiko-geth", "taiko-client", or "sync" is mentioned.
---

# Taiko Node Operations

Run Taiko nodes. A node = `taiko-geth` (execution) + `taiko-client` (consensus).

> **Network Selection:** Always ask which network if user hasn't specified "hoodi" or "mainnet".

## Quick Decision Guide

| Task | Resource |
|------|----------|
| Network config, chain IDs, RPCs | [Networks Reference](../taiko/references/networks.md) |
| Run node (Docker, recommended) | [Docker setup](./references/docker-setup.md) |
| Build from source | [Source build](./references/source-build.md) |
| Run Ethereum Hoodi L1 | [eth-docker](https://github.com/ethstaker/eth-docker) |
| Debug issues | [Troubleshooting](./references/node-troubleshooting.md) |

## Prerequisites

- **Hardware:** 16 GB RAM, 2 TB SSD, quad-core CPU
- **Software:** Docker `^24.0`, git `^2` (source: also Go `^1.21`, make `^4`)
- **L1 node required** — local strongly recommended (remote RPCs rate-limit)

## Quick Start (Docker)

```bash
git clone https://github.com/taikoxyz/simple-taiko-node.git && cd simple-taiko-node
cp .env.sample .env              # mainnet (.env.sample.hoodi for testnet)
# Edit .env: set L1_ENDPOINT_WS, L1_BEACON_HTTP, COMPOSE_PROFILES
docker compose up -d             # mainnet
docker compose -f docker-compose-hoodi.yml up -d  # testnet
```

**L1 endpoints:** Use `host.docker.internal` or machine's private IP, not `127.0.0.1`.

## Resources

- **Docs**: https://docs.taiko.xyz/guides/node-operators/
- **Releases**: https://github.com/taikoxyz/simple-taiko-node/releases
- **Discord**: https://discord.gg/aGZYtKqMjj
