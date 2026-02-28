# Taiko AI

AI agent skills and MCP servers for developing on and running nodes for Taiko networks.

Covers **Taiko Mainnet** (chain `167000`) and **Hoodi testnet** (chain `167013`).

## What's Inside

| Package | Description |
|---|---|
| `mcp-servers/taiko-data` | 16-tool MCP — balances, transactions, token transfers, gas, logs, bridge status, NFTs, search |
| `mcp-servers/taiko-explorer` | 10-tool MCP — ABI/source lookup, calldata decoding, EVM compatibility checks, Slither analysis |
| `mcp-servers/taiko-bridge` | 8-tool MCP — bridge ETH/ERC-20, message status, retry/recall, fee estimation |
| `mcp-servers/taiko-node-monitor` | 7-tool MCP (Python) — node health, sync status, logs, preconf peers |
| `packages/taiko-api-client` | Shared TypeScript client for Taikoscan V2, Blockscout V2, and Relayer APIs |
| `cli/` | `taiko` CLI — network, bridge, contract verify commands |

## Installation

### As AI agent skills (Cursor, Copilot, Windsurf, Cline, etc.)

```bash
npx skills add taikoxyz/taiko-ai
```

### Claude Code

```bash
/plugin marketplace add taikoxyz/taiko-ai
/plugin install taiko@taikoxyz
```

### Local development

```bash
npm ci
npm -ws run build
```

## Running MCP Servers

MCP servers work locally via stdio with no hosting required. Your MCP client spawns them as subprocesses.

```json
{
  "mcpServers": {
    "taiko-data": {
      "command": "node",
      "args": ["path/to/mcp-servers/taiko-data/dist/index.js"],
      "env": { "TAIKOSCAN_API_KEY": "..." }
    }
  }
}
```

Optional HTTP deployment is also supported — see [how_to_deploy.md](how_to_deploy.md).

## Usage Examples

### Smart contract development

```
Deploy an ERC-20 token on Taiko Hoodi
Write a cross-chain counter that increments via bridge messages
Verify my contract at 0x1234... on Taikoscan mainnet
```

### Bridge operations

```
Bridge 0.1 ETH from Ethereum to Taiko
Check the status of my bridge message
What are the current relayer fees?
```

### Node operations

```
Set up a Taiko mainnet node with Docker
My node is stuck syncing — help me debug it
How do I enable preconfirmation P2P on my Hoodi node?
```

## Environment Variables

| Variable | Used by | Required |
|---|---|---|
| `TAIKOSCAN_API_KEY` | taiko-data, taiko-explorer | Yes |
| `TAIKO_MAINNET_PRIVATE_KEY` | taiko-bridge (write tools) | For bridge transactions |
| `TAIKO_HOODI_PRIVATE_KEY` | taiko-bridge (write tools) | For testnet bridge transactions |

## Resources

- [Taiko Docs](https://docs.taiko.xyz) | [GitHub](https://github.com/taikoxyz/taiko-mono)
- [Taikoscan](https://taikoscan.io) | [Hoodi Taikoscan](https://hoodi.taikoscan.io)
- [Bridge](https://bridge.taiko.xyz) | [Hoodi Bridge](https://bridge.hoodi.taiko.xyz)

## License

MIT
