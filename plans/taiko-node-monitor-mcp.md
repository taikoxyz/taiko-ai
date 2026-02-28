# taiko-node-monitor MCP — Implementation Plan

## Status
[ ] Not started

## Summary

`taiko-node-monitor` provides AI agents and node operators with real-time visibility and control over a locally running Taiko node (via `simple-taiko-node` Docker Compose setup). It is built with **Python FastMCP** because Python's official `docker` SDK provides first-class container management, log streaming, and subprocess control. The MCP is **local stdio only** — it requires access to `/var/run/docker.sock` and `localhost:8547`, making remote hosting architecturally inappropriate. It extends the existing `taiko-node-runner` agent in this repo.

This is the second highest-priority Phase 1 MCP — node operators need monitoring today.

---

## Prerequisites

- Python ≥ 3.11
- `uv` package manager (for `uvx` zero-install distribution)
- Docker running with `simple-taiko-node` (or user in `docker` group for socket access)
- `taikoxyz/taiko-ai` repo: `mcp-servers/` directory exists

**No dependency on `@taikoxyz/taiko-api-client`** (this is a Python MCP, standalone).

---

## Target File Structure

```
mcp-servers/taiko-node-monitor/
├── pyproject.toml              # Package: taiko-node-monitor, dist via PyPI
├── README.md
├── taiko_node_monitor/
│   ├── __init__.py
│   ├── server.py               # FastMCP tools (main entry point)
│   ├── docker_ops.py           # Docker SDK integration
│   ├── rpc.py                  # Taiko JSON-RPC helpers
│   └── preconf.py              # Preconf log parsing + env key allowlist
└── tests/
    ├── test_rpc.py
    └── test_docker_ops.py
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKO_RPC` | No | `http://localhost:8547` | Taiko L2 RPC endpoint |
| `L1_RPC` | No | `http://localhost:8545` | L1 (Ethereum) RPC endpoint |
| `COMPOSE_DIR` | No | `~/simple-taiko-node` | Path to `simple-taiko-node` directory |
| `DOCKER_HOST` | No | (auto) | Override Docker socket (e.g. rootless Docker) |

---

## Tools

| Tool | Description | Transport |
|------|-------------|-----------|
| `get_node_health` | Sync status, peer count, block number, chain ID, software version | stdio only |
| `get_sync_progress` | Sync percentage + blocks behind head | stdio only |
| `get_peer_count` | P2P peer connection count | stdio only |
| `check_l1_connection` | L1 RPC connectivity, block number, sync status | stdio only |
| `get_node_logs` | Recent logs from taiko-geth and taiko-client (max 500 lines, optional grep filter) | stdio only |
| `restart_service` | Restart taiko-geth, taiko-client, or all (WARNING: interrupts block production) | stdio only |
| `get_preconf_node_status` | Preconfirmation enabled flag, peer count, P2P config status | stdio only |

---

## Implementation Steps

### Step 1: Initialize Python package

```bash
mkdir -p mcp-servers/taiko-node-monitor/taiko_node_monitor
mkdir -p mcp-servers/taiko-node-monitor/tests
cd mcp-servers/taiko-node-monitor
```

`pyproject.toml`:
```toml
[project]
name = "taiko-node-monitor"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "fastmcp>=2.0,<3.0",
  "docker>=7.0",
  "httpx>=0.27"
]

[project.scripts]
taiko-node-monitor = "taiko_node_monitor.server:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

### Step 2: Implement `rpc.py` — Taiko JSON-RPC helpers

```python
import httpx

async def rpc_call(url: str, method: str, params: list = []):
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json={
            "jsonrpc": "2.0", "method": method, "params": params, "id": 1
        })
        data = resp.json()
        if "error" in data:
            raise RuntimeError(f"RPC error: {data['error']}")
        return data["result"]
```

Key RPC calls:
- `eth_chainId` → verify correct network (mainnet = `0x28c58`, Hoodi = `0x28c65`)
- `eth_blockNumber` → current L2 block
- `eth_syncing` → sync status object or `false`
- `net_peerCount` → peer count (hex)
- `web3_clientVersion` → taiko-geth version string
- `taiko_headL1Origin` → `{blockID, l2Hash, l1BlockHash, l1BlockHeight}`
- `taiko_l1OriginHeight` → `{height}` (compare to actual L1 for lag)

**Block lag calculation**:
```python
node_l1_height = int((await rpc_call(l2_rpc, "taiko_l1OriginHeight"))["height"], 16)
actual_l1 = int(await rpc_call(l1_rpc, "eth_blockNumber"), 16)
lag = actual_l1 - node_l1_height
```

### Step 3: Implement `docker_ops.py` — Docker SDK integration

```python
import docker
import asyncio

client = docker.from_env()  # reads DOCKER_HOST env var automatically

SERVICE_LABELS = {
    "taiko-geth": "l2_execution_engine",
    "taiko-client": "taiko_client",
}

def find_container(service: str):
    """Find container by Docker Compose service label (robust across directory names)."""
    label = SERVICE_LABELS.get(service)
    containers = client.containers.list(
        filters={"label": f"com.docker.compose.service={label}"}
    )
    return containers[0] if containers else None
```

Use `com.docker.compose.service` labels — this is more reliable than container name prefixes that vary by directory name.

**`restart_service`** implementation:
```python
async def restart(service: str) -> dict:
    loop = asyncio.get_event_loop()
    services = ["taiko-geth", "taiko-client"] if service == "all" else [service]
    results = []
    for svc in services:
        container = find_container(svc)
        if not container:
            results.append({"service": svc, "error": "container not found"})
            continue
        await loop.run_in_executor(None, container.restart, 10)
        container.reload()
        results.append({
            "service": svc,
            "status": container.status,
            "warning": "Service interrupted — block production paused during restart",
        })
    return {"results": results}
```

**`get_node_logs`** implementation:
- Get logs from both containers: `container.logs(tail=min(lines, 500), timestamps=True)`
- Decode as UTF-8, apply case-insensitive grep filter if provided
- Return combined output with `=== service-name ===` section headers
- Cap at 500 lines to prevent flooding LLM context

### Step 4: Implement `preconf.py` — preconf status

Parse preconf peer count from container logs using regex:
```python
import re

def parse_peer_count_from_logs(log_text: str) -> int | None:
    matches = re.findall(r"peersLen=(\d+)", log_text)
    return int(matches[-1]) if matches else None
```

Read `.env` from `COMPOSE_DIR` for preconf config. **Safe env key allowlist** — only expose these keys:
```python
SAFE_ENV_KEYS = {
    "ENABLE_PRECONFS_P2P", "PUBLIC_IP", "P2P_TCP_PORT", "P2P_UDP_PORT",
    "COMPOSE_PROFILES", "PROVER_STARTING_BLOCK_ID", "DISABLE_P2P_SYNC",
}
# Never expose: PRIV_RAW, L1_ENDPOINT_WS, L1_BEACON_HTTP,
# anything containing KEY / SECRET / TOKEN / PASSWORD
```

Thresholds: mainnet >= 6 peers healthy, Hoodi >= 3 peers.

### Step 5: Implement `server.py` — FastMCP entry point

```python
from fastmcp import FastMCP
import os
from .rpc import TaikoRPC
from .docker_ops import DockerOps
from .preconf import PreconfMonitor

mcp = FastMCP(
    "taiko-node-monitor",
    instructions="Monitor and manage a local Taiko node via Docker and RPC."
)

TAIKO_RPC_URL = os.getenv("TAIKO_RPC", "http://localhost:8547")
L1_RPC_URL = os.getenv("L1_RPC", "http://localhost:8545")
COMPOSE_DIR = os.getenv("COMPOSE_DIR", os.path.expanduser("~/simple-taiko-node"))

@mcp.tool()
async def restart_service(service: str) -> dict:
    """Restart taiko-geth, taiko-client, or all. WARNING: interrupts block production."""
    if service not in ("taiko-geth", "taiko-client", "all"):
        raise ValueError(f"Unknown service '{service}'. Valid: taiko-geth, taiko-client, all")
    # ... implementation

def main():
    mcp.run()  # stdio transport
```

FastMCP auto-generates JSON Schema from Python type hints — no explicit schema declarations needed.

### Step 6: Claude Desktop / Code configuration

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "taiko-node-monitor": {
      "command": "uvx",
      "args": ["taiko-node-monitor"],
      "env": {
        "TAIKO_RPC": "http://localhost:8547",
        "L1_RPC": "http://localhost:8545",
        "COMPOSE_DIR": "/home/user/simple-taiko-node"
      }
    }
  }
}
```

### Step 7: PyPI publish setup

```bash
# Requires taikoxyz PyPI org account + GitHub Actions token
pip install build twine
python -m build
twine upload dist/*
```

Add GitHub Actions workflow `.github/workflows/publish-node-monitor.yml` for automated PyPI publish on tag.

---

## Hosting

**Local stdio only.** The MCP runs as a local subprocess on the node operator's machine. No remote hosting.

Distribution: `uvx taiko-node-monitor` (zero-install via PyPI) or `pip install taiko-node-monitor`.

**Future v2**: `get_node_health`, `get_sync_progress`, `get_peer_count`, `check_l1_connection` can optionally expose via `mcp.run(transport="http", port=8000)` for multi-node monitoring dashboards. `restart_service` and `get_node_logs` must NEVER be exposed remotely.

---

## Verification

With `simple-taiko-node` running locally:

```bash
# Run the MCP locally
uvx taiko-node-monitor

# Or from source
cd mcp-servers/taiko-node-monitor
uv run python -m taiko_node_monitor
```

Test from Claude Code:
1. `get_node_health` → should return sync status, chain ID `167000` (mainnet) or `167013` (Hoodi)
2. `get_sync_progress` → should return either `{synced: true}` or `{currentBlock: N, highestBlock: M, percentage: P}`
3. `get_peer_count` → should return `{count: N}` where N > 0
4. `check_l1_connection` → should return L1 block number
5. `get_node_logs` with `filter: "ERROR"` → should return recent error lines
6. `get_preconf_node_status` → should return `{preconfs_enabled: bool, ...}`
7. `restart_service` with `service: "taiko-client"` → restart and confirm status returns `"running"`

---

## Research Notes

<!-- Merged from research_impl_taiko_node_monitor.md — reference only -->

### Framework Decision
Python FastMCP chosen over TypeScript MCP SDK because:
- `docker` Python SDK is official, mature, superior for log streaming (`container.logs(stream=True)` vs raw TCP demux)
- FastMCP auto-generates schema from type hints (less boilerplate)
- `uvx taiko-node-monitor` zero-install distribution via PyPI

### Docker Container Resolution
Use `com.docker.compose.service` labels to find containers. This avoids brittle name-prefix-based lookup (names like `simple-taiko-node-l2_execution_engine-1` vary by directory).

```python
SERVICE_LABELS = {
    "taiko-geth": "l2_execution_engine",   # verify against actual simple-taiko-node labels
    "taiko-client": "taiko_client",
}
```

**Open question**: Verify exact Docker Compose service names in `simple-taiko-node/docker-compose.yml`.

### Default Ports (simple-taiko-node)
| Service | Port | Purpose |
|---------|------|---------|
| taiko-geth HTTP RPC | 8547 | JSON-RPC |
| taiko-geth WebSocket | 8548 | Subscriptions |
| taiko-geth P2P TCP | 4001 | Preconf P2P gossip |
| taiko-client HTTP | 9546 | Status/metrics |
| Grafana | 3001 | Dashboard |
| Prometheus | 9090 | Metrics |

### Preconf Phase 2 RPC Methods (Q1 2026)
When Phase 2 ships, `taiko-geth` will likely add:
- `taiko_getPreconfStatus()` — node preconf participation status
- `taiko_getPreconfPeers()` — known preconf P2P peers
- `taiko_submitPreconfirmation(tx)` — direct preconf tx submission

Not available as of February 2026. Monitor `taikoxyz/taiko-geth` releases.

### Open Questions
| Question | Impact | How to Validate |
|----------|--------|-----------------|
| `taiko_l1OriginHeight` exact return schema | High | Check `taiko-geth` source `internal/ethapi/api.go` |
| Exact Docker Compose service labels in mainnet vs Hoodi | High | Check both `docker-compose.yml` files |
| Prometheus as primary data source instead of log parsing? | Medium | `localhost:9090/api/v1/query` — `simple-taiko-node` ships it |
| Windows Docker named pipe support | Low | `DOCKER_HOST=npipe:////./pipe/docker_engine` |
| PyPI `taikoxyz` org account + publish workflow | High — blocks `uvx` | Coordinate with Taiko team |
| FastMCP 2.x API stability | High — pin `<3.0` | Check CHANGELOG |
