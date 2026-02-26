# Docker Setup with simple-taiko-node

## Setup

```bash
git clone https://github.com/taikoxyz/simple-taiko-node.git
cd simple-taiko-node

# Copy env (use .env.sample.hoodi for testnet)
cp .env.sample .env
```

Windows: run `git config core.autocrlf false` after cloning.

## Configure .env

**Required settings:**
```bash
L1_ENDPOINT_WS=ws://<L1_IP>:8546       # Use host.docker.internal or private IP, not 127.0.0.1
L1_BEACON_HTTP=http://<L1_IP>:5052
COMPOSE_PROFILES=l2_execution_engine     # Options: l2_execution_engine, prover
```

**P2P for preconfirmations (recommended):**
```bash
ENABLE_PRECONFS_P2P=true
PUBLIC_IP=<EXTERNAL_IP>                  # curl ifconfig.me; must be publicly reachable
P2P_TCP_PORT=4001                        # Must be open on firewall
P2P_UDP_PORT=30303                       # Must be open on firewall
PRIV_RAW=<HEX_PRIVATE_KEY>             # Unique per node, no funds needed
```

Without P2P, the node only updates chain head from on-chain events.

## Start

```bash
docker compose down -v                                   # Remove old testnet data if needed
docker compose up -d                                     # Alethia mainnet
docker compose -f docker-compose-hoodi.yml up -d         # Hoodi testnet
```

## Verify

```bash
# Check chain ID (0x28c58=Alethia, 0x28c65=Hoodi)
curl -s http://localhost:8547 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}'

# Check block height (should be growing)
curl -s http://localhost:8547 -X POST -H "Content-Type: application/json" \
  --data '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}'

# Verify P2P (peersLen >= 6 mainnet, >= 3 testnet)
docker compose logs -f | grep "peer tick"
```

Grafana: `http://localhost:3001/d/L2ExecutionEngine/l2-execution-engine-overview`

## Manage

```bash
docker compose down                                 # Stop
docker compose down && docker compose up -d         # Restart
git pull origin main && docker compose pull          # Update
docker compose down -v                               # Remove + data
docker compose logs -f                               # Logs
docker compose logs -f l2_execution_engine           # Execution logs
```

## Ethereum Hoodi L1 Node

For Taiko Hoodi, use [eth-docker](https://github.com/ethstaker/eth-docker):

```bash
git clone https://github.com/ethstaker/eth-docker && cd eth-docker
./ethd config    # Select Hoodi, enable Grafana
```

Add to `COMPOSE_FILE` in `.env`: `el-shared.yml:cl-shared.yml` (exposes RPC — not encrypted).

**Fusaka beacon client flags** (required for blob availability):

| Client | Flag |
|--------|------|
| Lighthouse | `--semi-supernode` or `--supernode` |
| Teku | `--p2p-subscribe-all-custody-subnets-enabled` |
| Grandine | `--subscribe-all-data-column-subnets` |
| Lodestar | `--supernode` |
| Nimbus | `--debug-peerdas-supernode` |

Start: `./ethd up` — monitor at `http://localhost:3000`.
