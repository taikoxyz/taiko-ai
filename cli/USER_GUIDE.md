# Taiko CLI User Guide

Command-line interface for Taiko network management, node operations, bridge interactions, and contract verification.

Supports **Taiko Mainnet** (chain 167000) and **Hoodi Testnet** (chain 167013).

## Installation

```bash
# From the monorepo root
npm install
npm run build --workspace=cli

# Run directly
node cli/dist/index.js --help

# Or link globally
npm link --workspace=cli
taiko --help
```

Requires **Node.js >= 20**.

## Configuration

The CLI stores its active network profile in `~/.taiko/config.yaml`:

```yaml
active_network: mainnet
networks:
  mainnet:
    rpc_url: https://rpc.mainnet.taiko.xyz
  hoodi:
    rpc_url: https://rpc.hoodi.taiko.xyz
```

The file is created automatically on first use with sensible defaults. You can edit it directly or use `taiko network switch`.

### Environment Variable Overrides

| Variable | Description |
|---|---|
| `TAIKO_NETWORK` | Override active network (`mainnet` or `hoodi`) |
| `TAIKO_RPC_URL` | Override RPC endpoint for the active network |
| `TAIKO_RPC` | Override RPC endpoint for `taiko node status` |
| `TAIKO_PRIVATE_KEY` | Private key for bridge write operations (`0x`-prefixed, 64 hex chars) |
| `TAIKO_ETHERSCAN_API_KEY` | API key for Taikoscan contract verification |
| `ETHERSCAN_API_KEY` | Fallback API key for Taikoscan (if `TAIKO_ETHERSCAN_API_KEY` not set) |
| `COMPOSE_DIR` | Path to `simple-taiko-node` directory (default: `~/simple-taiko-node`) |

## Global Options

Every command supports:

| Flag | Description |
|---|---|
| `--json` | Output structured JSON instead of human-readable text |
| `--network <name>` | Override the active network for this command (`mainnet` or `hoodi`) |
| `--help` | Show help for the command |

The `--json` flag produces a consistent schema for AI agent and script integration (see [JSON Output Format](#json-output-format)).

---

## Commands

### `taiko network` — Manage Network Profiles

#### `taiko network switch <network>`

Set the active network profile.

```bash
taiko network switch hoodi
taiko network switch mainnet
```

#### `taiko network status`

Health check: tests reachability of the RPC endpoint, Taikoscan explorer, and relayer.

```bash
taiko network status
taiko network status --network hoodi
taiko network status --json
```

Example output:
```
✓ network status [mainnet]
  network: mainnet
  chain_id: 167000
  rpc_reachable: yes
  explorer_reachable: yes
  relayer_reachable: yes
  block_number: 4523891
```

#### `taiko network info`

Show full network profile: chain ID, contract addresses, current block, gas price.

```bash
taiko network info
taiko network info --network hoodi --json
```

Example output:
```
✓ network info [mainnet]
  active_network: mainnet
  chain_id: 167000
  rpc_url: https://rpc.mainnet.taiko.xyz
  block_number: 4523891
  gas_price: 0.0200 Gwei
  explorer: https://taikoscan.io
  relayer: https://relayer.mainnet.taiko.xyz
  contracts:
    bridge: 0x1670000000000000000000000000000000000001
    signal_service: 0x1670000000000000000000000000000000000005
    anchor: 0x1670000000000000000000000000000000010001
    erc20_vault: 0x1670000000000000000000000000000000000002
```

---

### `taiko node` — Manage Your Taiko Node

These commands wrap Docker Compose for the [simple-taiko-node](https://github.com/taikoxyz/simple-taiko-node) setup.

Set `COMPOSE_DIR` if your node directory is not at `~/simple-taiko-node`.

#### `taiko node start`

Start the node containers.

```bash
taiko node start
taiko node start --prover       # Enable prover profile
taiko node start --proposer     # Enable proposer profile
```

#### `taiko node stop`

Stop the node containers.

```bash
taiko node stop
```

#### `taiko node restart`

Stop and restart the node.

```bash
taiko node restart
```

#### `taiko node status`

Show sync status, block height, peer count, and L1 origin from the node's RPC.

```bash
taiko node status
taiko node status --rpc-url http://localhost:8547
taiko node status --json
```

Example output:
```
✓ node status [mainnet]
  rpc_url: https://rpc.mainnet.taiko.xyz
  block_number: 4523891
  peer_count: 12
  l1_block_height: 21456789
  sync:
    synced: yes
```

#### `taiko node logs`

Stream Docker Compose logs.

```bash
taiko node logs
taiko node logs --follow                          # Follow live output
taiko node logs --service l2_execution_engine      # Only taiko-geth
taiko node logs --service taiko_client_driver      # Only taiko-client
taiko node logs --tail 200                        # Last 200 lines
taiko node logs --json                            # JSON output (non-follow mode)
```

`--follow` and `--json` cannot be used together.

#### `taiko node upgrade`

Pull the latest Docker images and restart.

```bash
taiko node upgrade
```

---

### `taiko bridge` — Bridge Operations

#### `taiko bridge status <tx-hash>`

Check the relay status of a bridge transaction by message hash or transaction hash.

```bash
taiko bridge status 0xabc123...
taiko bridge status 0xabc123... --network hoodi
taiko bridge status 0xabc123... --json
```

Status values: `NEW`, `RETRIABLE`, `DONE`, `FAILED`, `RECALLED`, `NOT_FOUND`.

#### `taiko bridge history <address>`

Get bridge history for an address from the relayer.

```bash
taiko bridge history 0xYourAddress
taiko bridge history 0xYourAddress --page 2 --size 50
taiko bridge history 0xYourAddress --json
```

#### `taiko bridge deposit <amount>`

This command is currently a placeholder and exits with an error.

```bash
taiko bridge deposit 0.1
```

> **Note**: Use the `taiko-bridge` MCP server (`bridge_eth`, `bridge_erc20`, `retry_message`, `recall_message`) for actual bridge transactions.

---

### `taiko contract` — Smart Contract Utilities

#### `taiko contract verify <address> <contract-identifier>`

Verify a deployed contract on Taikoscan. Wraps `forge verify-contract` with Taiko-specific chain ID and API URL auto-configured.

**Prerequisites:**
- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed (`forge` in PATH)
- `TAIKO_ETHERSCAN_API_KEY` environment variable set (get one at [taikoscan.io/myapikey](https://taikoscan.io/myapikey))

```bash
export TAIKO_ETHERSCAN_API_KEY=your-key-here

# Basic verification
taiko contract verify 0xContractAddr src/MyContract.sol:MyContract

# With compiler options
taiko contract verify 0xContractAddr src/MyContract.sol:MyContract \
  --compiler-version "0.8.24+commit.e11b9ed9" \
  --optimizer-runs 200

# With constructor args and polling
taiko contract verify 0xContractAddr src/MyContract.sol:MyContract \
  --constructor-args "0x000000000000000000000000..." \
  --watch

# On Hoodi testnet
taiko contract verify 0xContractAddr src/MyContract.sol:MyContract --network hoodi
```

| Option | Description |
|---|---|
| `--compiler-version <ver>` | Solidity compiler version (e.g. `0.8.24+commit.e11b9ed9`) |
| `--optimizer-runs <n>` | Optimizer runs count (default: 200) |
| `--constructor-args <hex>` | ABI-encoded constructor arguments |
| `--watch` | Poll Taikoscan until verification completes |

---

## JSON Output Format

When `--json` is passed, every command outputs a structured JSON object:

```json
{
  "schema_version": "1.0",
  "command": "network status",
  "status": "success",
  "network": "mainnet",
  "data": { ... },
  "errors": [],
  "warnings": [],
  "metrics": {
    "latency_ms": 342
  }
}
```

| Field | Type | Description |
|---|---|---|
| `schema_version` | `"1.0"` | Output schema version |
| `command` | `string` | The command that was run |
| `status` | `"success"` \| `"error"` | Whether the command succeeded |
| `network` | `string` | Network the command ran against |
| `data` | `object` | Command-specific result data |
| `errors` | `string[]` | Error messages (empty on success) |
| `warnings` | `string[]` | Non-fatal warnings |
| `metrics.latency_ms` | `number` | Execution time in milliseconds |

This format is designed for consumption by AI agents, scripts, and monitoring tools.

---

## Quick Reference

```
taiko network switch <mainnet|hoodi>    Switch active network
taiko network status                    Health check endpoints
taiko network info                      Show chain details and contracts

taiko node start [--prover] [--proposer]  Start node containers
taiko node stop                           Stop node containers
taiko node restart                        Restart node
taiko node status                         Sync status and block height
taiko node logs [--follow] [--service]    View container logs
taiko node upgrade                        Pull latest images and restart

taiko bridge status <hash>              Check bridge message relay status
taiko bridge history <address>          View bridge history for an address
taiko bridge deposit <amount>           Placeholder (not implemented)

taiko contract verify <addr> <id>       Verify contract on Taikoscan
```
