# How To Deploy MCPs (Taiko AI Repo)

Last updated: February 28, 2026.

## TL;DR
- You do **not** need to deploy these MCPs on central servers to use them.
- Today, this repo's MCP servers are implemented with **stdio transport** (local command processes), not HTTP endpoints.
- Best current setup:
  - Run `taiko-bridge` locally (private keys).
  - Run `taiko-node-monitor` on each node host (Docker socket access).
  - Run `taiko-data` and `taiko-explorer` locally unless/until HTTP transport is added.

## What Is Deployable Today

| MCP | Current transport | Recommended placement | Why |
|---|---|---|---|
| `taiko-data` | stdio | local per user/agent host | read-only, simple |
| `taiko-explorer` | stdio | local per user/agent host | includes optional Slither exec |
| `taiko-bridge` | stdio | local only | write tools require private key |
| `taiko-node-monitor` | FastMCP local process | run on each node machine | needs local Docker/node access |

## Important Constraint
Current TS MCP entrypoints use `StdioServerTransport`:
- `mcp-servers/taiko-data/src/index.ts`
- `mcp-servers/taiko-explorer/src/index.ts`
- `mcp-servers/taiko-bridge/src/index.ts`

That means there is no `/mcp` HTTP endpoint out of the box yet.
The existing `mcp-servers/taiko-data/wrangler.toml` is not sufficient by itself until an HTTP MCP entrypoint is added.

## Prerequisites
- Node.js 20+
- npm
- Python 3.11+ (for `taiko-node-monitor`)
- Docker (for `taiko-node-monitor` operations)

## Build Once

```bash
cd /path/to/taiko-ai
npm ci
npm -ws run build
```

Optional validation:

```bash
npm -ws run test
cd mcp-servers/taiko-node-monitor && pytest -q
```

## Local MCP Configuration (Recommended)
Use absolute paths in your MCP client config.

### 1) taiko-data

```json
{
  "mcpServers": {
    "taiko-data": {
      "command": "node",
      "args": ["/ABS/PATH/taiko-ai/mcp-servers/taiko-data/dist/index.js"],
      "env": {
        "TAIKOSCAN_API_KEY": "<your-key>",
        "TAIKO_MAINNET_RPC": "https://rpc.mainnet.taiko.xyz",
        "TAIKO_HOODI_RPC": "https://rpc.hoodi.taiko.xyz"
      }
    }
  }
}
```

### 2) taiko-explorer

```json
{
  "mcpServers": {
    "taiko-explorer": {
      "command": "node",
      "args": ["/ABS/PATH/taiko-ai/mcp-servers/taiko-explorer/dist/index.js"],
      "env": {
        "TAIKOSCAN_API_KEY": "<your-key>",
        "TAIKO_EVM_VERSION": "shanghai",
        "SLITHER_PATH": "slither"
      }
    }
  }
}
```

Notes:
- `SLITHER_PATH` is only needed for `analyze_contract`.
- If Slither is missing, other explorer tools still work.

### 3) taiko-bridge (local only)

```json
{
  "mcpServers": {
    "taiko-bridge": {
      "command": "node",
      "args": ["/ABS/PATH/taiko-ai/mcp-servers/taiko-bridge/dist/index.js"],
      "env": {
        "TAIKO_MAINNET_PRIVATE_KEY": "0x...",
        "TAIKO_HOODI_PRIVATE_KEY": "0x...",
        "TAIKO_MAINNET_RPC": "https://rpc.mainnet.taiko.xyz",
        "TAIKO_HOODI_RPC": "https://rpc.hoodi.taiko.xyz",
        "TAIKO_L1_MAINNET_RPC": "https://eth.drpc.org",
        "TAIKO_L1_HOODI_RPC": "https://hoodi.drpc.org"
      }
    }
  }
}
```

Security:
- Do not share this key across teams/environments.
- Prefer network-specific keys over one global `TAIKO_PRIVATE_KEY`.

### 4) taiko-node-monitor (run on node host)
Install and run on the same machine as `simple-taiko-node`:

```bash
cd /ABS/PATH/taiko-ai/mcp-servers/taiko-node-monitor
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

MCP client config:

```json
{
  "mcpServers": {
    "taiko-node-monitor": {
      "command": "/ABS/PATH/taiko-ai/mcp-servers/taiko-node-monitor/.venv/bin/taiko-node-monitor",
      "env": {
        "TAIKO_RPC": "http://localhost:8547",
        "L1_RPC": "http://localhost:8545",
        "COMPOSE_DIR": "/home/<user>/simple-taiko-node",
        "TAIKO_MIN_PEERS_MAINNET": "6",
        "TAIKO_MIN_PEERS_TESTNET": "3"
      }
    }
  }
}
```

## If You Need Central Server URLs Later
You need follow-up engineering first.

### Minimum required changes
1. Add HTTP MCP transport entrypoints (streamable HTTP) for TS MCPs.
2. Split `taiko-bridge` into:
   - read-only server (hostable)
   - write server (local only)
3. Add auth (API keys/JWT), rate limiting, and request logging.
4. Add container images + deployment manifests.

### Suggested hosting target
- `taiko-data` and read-only `taiko-explorer`: Cloud Run/Fly/Railway.
- `taiko-node-monitor`: do not centralize; keep per-node.
- `taiko-bridge` write tools: keep local by design.

## Troubleshooting
- `command not found` in MCP client:
  - Use absolute `node` path and absolute script path.
- `Taikoscan API error`:
  - Set valid `TAIKOSCAN_API_KEY`.
- `Slither not found`:
  - `pip install slither-analyzer` and set `SLITHER_PATH`.
- Node monitor cannot see containers:
  - Verify Docker daemon access and correct `COMPOSE_DIR`.

## Operational Checklist
- [ ] `npm -ws run build` passes
- [ ] keys and RPC env vars set
- [ ] MCP client can list tools for each server
- [ ] `taiko-bridge` keys stored in secure secret manager/local env only
- [ ] node-monitor tested on actual node host
