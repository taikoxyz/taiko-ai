# Docker Setup with simple-taiko-node

Complete guide to running a Taiko node using Docker with [simple-taiko-node](https://github.com/taikoxyz/simple-taiko-node).

## Prerequisites

- Docker `^24.0` installed and running
- Git `^2` installed
- An L1 Ethereum node (local recommended):
  - Alethia mainnet → Ethereum Mainnet node
  - Hoodi testnet → Ethereum Hoodi node

## Step-by-Step Setup

### 1. Clone simple-taiko-node

```bash
git clone https://github.com/taikoxyz/simple-taiko-node.git
cd simple-taiko-node
```

Windows users: run `git config core.autocrlf false` after cloning.

### 2. Copy the Environment File

```bash
# For Taiko Alethia (mainnet)
cp .env.sample .env

# For Taiko Hoodi (testnet)
cp .env.sample.hoodi .env
```

### 3. Configure L1 Endpoints

Edit `.env` and set your L1 node endpoints:

```bash
L1_ENDPOINT_WS=ws://<YOUR_L1_IP>:8546
L1_BEACON_HTTP=http://<YOUR_L1_IP>:5052
```

**Important:** If your L1 node runs on the same machine, do NOT use `127.0.0.1` — use `host.docker.internal` or your machine's private IP (find with `ip addr show` or `ifconfig`).

### 4. Set Compose Profiles

In `.env`, set `COMPOSE_PROFILES` to the services you want:

```bash
COMPOSE_PROFILES=l2_execution_engine
```

Available profiles: `l2_execution_engine`, `prover`. For prover, also set `ENABLE_PROVER=true`.

### 5. Remove Old Volumes (if upgrading)

If you previously ran a different testnet:

```bash
docker compose down -v
```

### 6. Configure P2P for Preconfirmations (Recommended)

To receive preconfirmed blocks and stay at chain tip:

```bash
# In .env:
ENABLE_PRECONFS_P2P=true
PUBLIC_IP=<YOUR_EXTERNAL_IP>           # Find with: curl ifconfig.me
P2P_TCP_PORT=4001                       # Must be open on firewall
P2P_UDP_PORT=30303                      # Must be open on firewall
PRIV_RAW=<HEX_PRIVATE_KEY>            # Unique per node, no funds needed
```

Without P2P enabled, the node will only update its chain head when events are emitted on-chain.

### 7. Start the Node

```bash
# Alethia mainnet
docker compose up -d

# Hoodi testnet
docker compose -f docker-compose-hoodi.yml up -d
```

You may need `sudo` if your user is not in the `docker` group.

## Verification

### Check Chain ID

```bash
# Alethia: should return 0x28c58 (167000)
# Hoodi: should return 0x28c65 (167013)
curl -s http://localhost:8547 -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'
```

### Check Block Height

```bash
curl -s http://localhost:8547 -X POST \
  -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'
```

If block number is `0` or not growing, check logs: `docker compose logs -f`

### Verify P2P Network

```bash
docker compose logs -f | grep "peer tick"
# Look for: peersLen=X
# Alethia: >= 6 peers is healthy
# Hoodi: >= 3 peers is healthy
```

### Grafana Dashboard

Access at `http://localhost:3001/d/L2ExecutionEngine/l2-execution-engine-overview`.

Verify the **chain head** is increasing. Once it matches the block explorer, you are fully synced.

## Management Commands

```bash
# Stop
docker compose down

# Restart
docker compose down && docker compose up -d

# Update to latest
git pull origin main && docker compose pull

# Remove everything (including data)
docker compose down -v

# Remove orphan containers
docker compose up -d --remove-orphans

# View logs
docker compose logs -f
docker compose logs -f l2_execution_engine
docker compose logs -f taiko_client_driver

# System resource usage
docker stats
```

## Running an Ethereum Hoodi L1 Node

For Taiko Hoodi, you need an Ethereum Hoodi L1 node. Recommended method using [eth-docker](https://github.com/ethstaker/eth-docker):

```bash
git clone https://github.com/ethstaker/eth-docker
cd eth-docker
./ethd config    # Select Hoodi testnet, enable Grafana
```

Expose RPC ports by adding to `COMPOSE_FILE` in `.env`:
```
COMPOSE_FILE=lighthouse-cl-only.yml:geth.yml:el-shared.yml:cl-shared.yml
```

Configure beacon client for Fusaka (supernode mode):
- Lighthouse: `--semi-supernode` or `--supernode`
- Teku: `--p2p-subscribe-all-custody-subnets-enabled`
- Grandine: `--subscribe-all-data-column-subnets`
- Lodestar: `--supernode`
- Nimbus: `--debug-peerdas-supernode`

Start:
```bash
./ethd up
```

Monitor at `http://localhost:3000` (Grafana).
