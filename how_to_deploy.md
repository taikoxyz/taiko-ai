# How To Deploy MCPs on a Server

Server deployment is **optional**. MCPs work locally without any hosting — your MCP client spawns them as subprocesses via stdio. Deploy to a server only if you need remote access.

## What Can Be Deployed

| MCP | HTTP mode | Notes |
|---|---|---|
| `taiko-data` | yes | read-only tools |
| `taiko-explorer` | yes | `analyze_contract` needs Slither on the host |
| `taiko-bridge` | yes (read-only) | write tools are local-only by design |

All HTTP servers expose `POST /mcp` and `GET /health`.

## Build

```bash
npm ci && npm -ws run build
```

## Start HTTP Servers

### taiko-data (port 3701)
```bash
cd mcp-servers/taiko-data
MCP_HTTP_HOST=0.0.0.0 MCP_HTTP_PORT=3701 TAIKOSCAN_API_KEY=... npm run start:http
```

### taiko-explorer (port 3702)
```bash
cd mcp-servers/taiko-explorer
MCP_HTTP_HOST=0.0.0.0 MCP_HTTP_PORT=3702 TAIKOSCAN_API_KEY=... npm run start:http
```

If using `analyze_contract`, install Slither on the host:
```bash
pip install slither-analyzer && export SLITHER_PATH=slither
```

### taiko-bridge read-only (port 3703)
```bash
cd mcp-servers/taiko-bridge
MCP_HTTP_HOST=0.0.0.0 MCP_HTTP_PORT=3703 npm run start:http
```

Bridge HTTP mode is intentionally read-only. Keep write tools on local stdio where private keys stay local.

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MCP_HTTP_HOST` | `127.0.0.1` | Bind address |
| `MCP_HTTP_PORT` | 3701/3702/3703 | Listen port |
| `MCP_ALLOWED_HOSTS` | — | Comma-separated host allowlist |
| `TAIKOSCAN_API_KEY` | — | Required for data and explorer |

## Client Config

```json
{
  "mcpServers": {
    "taiko-data": {
      "url": "https://your-host.example.com/mcp"
    }
  }
}
```

## Security

- Do not expose bridge private keys to hosted servers.
- Prefer binding to `127.0.0.1` and front with a TLS reverse proxy.
- For public binding (`0.0.0.0`), set `MCP_ALLOWED_HOSTS`.

## Troubleshooting

- **405 on `GET /mcp`**: expected — use `POST /mcp`.
- **Missing Taikoscan data**: set `TAIKOSCAN_API_KEY`.
- **`analyze_contract` fails**: install Slither and set `SLITHER_PATH`.
