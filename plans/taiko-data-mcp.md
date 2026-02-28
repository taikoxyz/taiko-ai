# taiko-data MCP — Implementation Plan

## Status
[x] Implemented — `mcp-servers/taiko-data/` built, 12 tools, tests passing. Pending: Taikoscan API key + CF Workers deploy.

**Implementation notes (deviations from plan):**
- Built from scratch (TypeScript MCP SDK + ethers.js v6) rather than forking mcp-ethers-server — cleaner, CF-Workers-friendly
- **Taikoscan V1 API is deprecated** — now using Etherscan V2: `https://api.etherscan.io/v2/api?chainid=167000`
- `relayer.taiko.xyz` does not resolve from current environment — `get_bridge_message_status` falls back to on-chain `IBridge.messageStatus()`
- Relayer routes confirmed from source: `GET /events`, `GET /blockInfo`, `GET /recommendedProcessingFees` (no `/events/{msgHash}` endpoint exists)
- `getCheckpoint` ABI on TaikoAnchor may differ from current deployment — `get_l1_checkpoint` falls back to `taiko_headL1Origin`

## Summary

`taiko-data` provides AI agents with complete read-only access to Taiko on-chain data via Taikoscan and Blockscout APIs. Built from scratch with TypeScript MCP SDK (not a fork of mcp-ethers-server), with Etherscan V2 API and 5 Taiko-specific tools added. It supports both Taiko Mainnet (167000) and Hoodi testnet (167013). Deployment target is **Cloudflare Workers** (free tier, 100k req/day) for zero-ops stateless hosting, with a local stdio fallback via `npx @taikoxyz/mcp-data`.

This is the highest-priority MCP — read-only, zero key management, broadest developer demand.

---

## Prerequisites

- `packages/taiko-api-client/` built (see `plans/shared-library.md`) — used for Taiko-specific tools
- Taikoscan API key from https://taikoscan.io
- Cloudflare account (for Workers deployment)
- npm workspace root `package.json` with `"workspaces": ["mcp-servers/*", "packages/*"]`

---

## Target File Structure

```
mcp-servers/taiko-data/
├── package.json              # @taikoxyz/mcp-data, version 0.1.0
├── tsconfig.json
├── wrangler.toml             # Cloudflare Workers config
├── src/
│   ├── index.ts              # Entry point: stdio transport (local)
│   ├── worker.ts             # Entry point: CF Workers (streamable HTTP)
│   ├── server.ts             # McpServer setup + tool registration
│   ├── networks.ts           # Network constants (re-export from taiko-api-client)
│   ├── tools/
│   │   ├── base-tools.ts     # Ported from mcp-ethers-server (existing 35+ tools)
│   │   └── taiko-tools.ts   # 5 Taiko-specific additions
│   └── lib/
│       ├── ethers-client.ts  # ethers.js PublicClient factory
│       └── taiko-rpc.ts      # Taiko-specific RPC helpers (taiko_headL1Origin)
└── tests/
    └── taiko-tools.test.ts
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKOSCAN_API_KEY` | Yes | — | API key for Taikoscan (both networks) |
| `TAIKO_MAINNET_RPC` | No | `https://rpc.mainnet.taiko.xyz` | Mainnet RPC override |
| `TAIKO_HOODI_RPC` | No | `https://rpc.hoodi.taiko.xyz` | Hoodi RPC override |
| `DEFAULT_NETWORK` | No | `mainnet` | Default network if not specified in tool call |

---

## Tools

### Inherited from mcp-ethers-server (configure via env vars)

| Tool | Description |
|------|-------------|
| `get_balance` | ETH balance for address |
| `get_transactions` | Transaction history with pagination |
| `get_block_info` | Block data by number or `latest` |
| `get_transaction_info` | Full tx details + receipt |
| `get_contract_abi` | Fetch ABI from Taikoscan |
| `read_contract` | Call view/pure contract function |
| `get_token_transfers` | ERC-20 transfer history |
| `get_gas_price` | Current gas price + safe/fast tiers |
| `get_block_number` | Latest block number |
| `get_transaction_count` | Nonce for address |
| `get_token_balance` | ERC-20 balance |
| `get_logs` | Contract event logs |

### Taiko-Specific Tools (new additions)

| Tool | Description | API |
|------|-------------|-----|
| `get_l1_checkpoint` | L1 state root anchored in a specific L2 block | TaikoAnchor contract `getCheckpoint()` |
| `get_bridge_message_status` | Current relay status of a bridge message (NEW/RETRIABLE/DONE/FAILED/RECALLED) | Taiko Relayer API + IBridge contract |
| `get_anchor_block_state` | Current L1 block that latest L2 block is anchored to + lag | `taiko_headL1Origin` RPC |
| `get_nft_holdings` | All ERC-721 and ERC-1155 holdings for an address | Taikoscan `addresstokenbalance` |
| `search` | Search by address, tx hash, block number, or token name | Taikoscan + Blockscout v2 |

---

## Implementation Steps

### Step 1: Fork mcp-ethers-server

```bash
cd mcp-servers/taiko-data
# Clone source files from https://github.com/crazyrabbitLTC/mcp-ethers-server
# Verify LICENSE is MIT
# Update package.json: name = "@taikoxyz/mcp-data"
npm install
```

### Step 2: Configure for Taiko networks

Update the provider factory to use Taiko RPCs and Taikoscan API:

```typescript
// src/networks.ts — override mcp-ethers-server's single-network config
export const NETWORKS = {
  mainnet: {
    chainId: 167000,
    rpc: process.env.TAIKO_MAINNET_RPC ?? "https://rpc.mainnet.taiko.xyz",
    taikoscanApi: "https://api.taikoscan.io/api",
    blockscout: "https://blockscoutapi.mainnet.taiko.xyz/api/v2",
    relayer: "https://relayer.taiko.xyz",
    bridge: "0x1670000000000000000000000000000000000001",
    anchor: "0x1670000000000000000000000000000000010001",
  },
  hoodi: {
    chainId: 167013,
    rpc: process.env.TAIKO_HOODI_RPC ?? "https://rpc.hoodi.taiko.xyz",
    taikoscanApi: "https://api.hoodi.taikoscan.io/api",
    blockscout: "https://blockscoutapi.hoodi.taiko.xyz/api/v2",
    relayer: "https://relayer.hoodi.taiko.xyz",
    bridge: "0x167D000000000000000000000000000000000001",
    anchor: "0x1670000000000000000000000000000000010001",
  },
} as const;
```

Add `network: z.enum(["mainnet", "hoodi"]).default("mainnet")` parameter to all tools.

### Step 3: Implement Taiko-specific tools

**`get_l1_checkpoint`**: Call `TaikoAnchor.getCheckpoint(l1BlockId)` view function. ABI: fetch from Taikoscan for `0x1670000000000000000000000000000000010001`, or source from `taikoxyz/taiko-mono/packages/protocol/artifacts/`.

**`get_bridge_message_status`**: Query `GET {relayer}/events/{msgHash}`. Fallback: call `IBridge.messageStatus(msgHash)` on-chain. Map status uint8 → `["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"]`.

**`get_anchor_block_state`**: Call `taiko_headL1Origin` JSON-RPC method. Returns `{blockID, l2Hash, l1BlockHash, l1BlockHeight}`. Also call `eth_blockNumber` to report lag.

**`get_nft_holdings`**: Taikoscan `?module=account&action=addresstokenbalance&address={addr}&contracttype=ERC-721,ERC-1155&apikey={key}`.

**`search`**: Detect query type by regex (address = `0x{40hex}`, tx hash = `0x{64hex}`, block = `^\d+$`). For token name search, use Blockscout v2 `/search?q={query}`.

### Step 4: Test Taikoscan API compatibility

Validate before full implementation (these must work):

```bash
# Balance
curl "https://api.taikoscan.io/api?module=account&action=balance&address=0x0000777735367b36bC9B61C50022d9D0700dB4Ec"

# Taiko RPC custom method
curl -X POST https://rpc.mainnet.taiko.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"taiko_headL1Origin","params":[],"id":1}'

# Blockscout search
curl "https://blockscoutapi.mainnet.taiko.xyz/api/v2/search?q=TAIKO"
```

### Step 5: Cloudflare Workers deployment

```toml
# wrangler.toml
name = "taiko-data-mcp"
main = "dist/worker.js"
compatibility_date = "2025-01-01"

[vars]
DEFAULT_NETWORK = "mainnet"
```

```bash
# Validate bundle size (must be <1MB compressed)
npm run build
wrangler deploy --dry-run

# Deploy
wrangler secret put TAIKOSCAN_API_KEY
wrangler deploy
```

**Critical validation**: Verify `ethers.js v6 JsonRpcProvider` works in Cloudflare's V8 isolate (no Node.js APIs). If it fails, switch to `viem` for the provider or move to Railway.

### Step 6: npm publish

```bash
npm publish --access public
```

Enables local use:
```json
{
  "mcpServers": {
    "taiko-data": {
      "command": "npx",
      "args": ["-y", "@taikoxyz/mcp-data"],
      "env": { "TAIKOSCAN_API_KEY": "your_key" }
    }
  }
}
```

---

## Hosting

**Primary**: Cloudflare Workers (free tier — 100k req/day, ~$0)
- URL: `https://taiko-data-mcp.{account}.workers.dev/mcp`
- Configure in Claude Desktop: `"url": "https://taiko-data-mcp.{account}.workers.dev/mcp"`

**Fallback** (if CF Workers has ethers.js compatibility issues): Railway at ~$5/month

**Local**: `npx @taikoxyz/mcp-data` via stdio for developer use

---

## Verification

After deployment, test these tool calls from Claude Code:

1. `get_balance` on GOLDEN_TOUCH_ADDRESS (`0x0000777735367b36bC9B61C50022d9D0700dB4Ec`) — should return non-zero ETH balance
2. `get_block_info` with `block_number: "latest"` — should return current Taiko block (verify chain ID = 167000)
3. `get_anchor_block_state` — should return an L1 block number (compare to Ethereum mainnet latest)
4. `get_bridge_message_status` with a known bridge tx hash from Taikoscan
5. `search` with query `"TAIKO"` — should return token results from Blockscout
6. Test `network: "hoodi"` variant of at least 2 tools

---

## Research Notes

<!-- Merged from research_impl_taiko_data.md — reference only -->

### Framework Decision
Fork `crazyrabbitLTC/mcp-ethers-server` (MIT, TypeScript, 40+ tools). Setting `ETHEREUM_RPC_URL=https://rpc.mainnet.taiko.xyz` and `ETHERSCAN_API_URL=https://api.taikoscan.io/api` makes 35+ of 40 tools work immediately.

**Why NOT Blockscout MCP**: Taikoscan uses Etherscan API format (`?module=account&action=...`). Blockscout MCP targets Blockscout REST v2 format (`/api/v2/addresses/`). Incompatible.

**ethers.js v6 vs viem**: Keep ethers.js v6 for this fork (it's already there). New MCPs (bridge, wallet) use viem.

### Taikoscan API Validation Points
- `addresstokenbalance` for NFTs — verify it's supported
- Relayer API `/events/{msgHash}` endpoint schema
- ethers.js v6 bundle size in CF Workers 1MB limit
- `JsonRpcProvider` in V8 isolates (no Node.js polyfills)
- `https://api.hoodi.taikoscan.io/api` operational status
- mcp-ethers-server LICENSE file (confirm MIT)

### Open API Questions
| Question | Impact |
|----------|--------|
| Does Taikoscan support `addresstokenbalance` for NFTs? | High — `get_nft_holdings` |
| Does the Relayer API have `/events/{msgHash}`? | High — `get_bridge_message_status` |
| Does ethers.js v6 bundle fit CF Workers 1MB? | High — hosting choice |
| Is `JsonRpcProvider` compatible with CF Workers V8? | High — core requirement |
| Is `https://api.hoodi.taikoscan.io/api` operational? | Medium — Hoodi support |

### Taiko-Specific RPC Methods
- `taiko_headL1Origin` → `{blockID, l2Hash, l1BlockHash, l1BlockHeight}`
- `taiko_l1OriginHeight` → `{height}`
- `taiko_getSyncMode` → `"full"` or `"snap"`

### Contract Addresses
- TaikoAnchor (L2, both networks): `0x1670000000000000000000000000000000010001`
- Bridge (Mainnet L2): `0x1670000000000000000000000000000000000001`
- Bridge (Hoodi L2): `0x167D000000000000000000000000000000000001`
- GOLDEN_TOUCH_ADDRESS: `0x0000777735367b36bC9B61C50022d9D0700dB4Ec`
