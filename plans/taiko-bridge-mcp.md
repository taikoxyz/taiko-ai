# taiko-bridge MCP — Implementation Plan

## Status
[x] Implemented — 18/18 tests pass

### Key implementation notes
- ABI JSON artifacts not available pre-built; defined inline as TypeScript `as const` arrays from Solidity source
- `privateKeyToAccount` imports from `viem/accounts`, not `viem`
- `RelayerEvent.data.Message` (capitalized) is the message struct; `event.message` does not exist
- `RelayerClient.getEvents(address, network, page, size)` — positional args
- Tool registration uses `server.tool(name, description, zodSchema, handler)` (not `registerTool`)
- npm workspace hoists vitest to root; test script uses `../../node_modules/.bin/vitest`

## Summary

`taiko-bridge` provides AI agents with L1↔L2 bridge operations, relay monitoring, and message management on Taiko. It is built **from scratch** using TypeScript MCP SDK + `viem` v2 — no existing bridge MCP exists for any EVM L2 to fork. The MCP uses a **split architecture**: read-only tools (status queries, fee estimation, token lists) can be hosted remotely on Cloudflare Workers; write tools (bridge_eth, bridge_erc20, retry_message, recall_message) require signing and must run as **local stdio** with `TAIKO_PRIVATE_KEY` in the user's environment. For v1, ship as local stdio only (simpler, safer), then add CF Workers for read-only tools in v2.

ABIs for IBridge, IERC20Vault, and ISignalService are sourced directly from `taikoxyz/taiko-mono`.

---

## Prerequisites

- `packages/taiko-api-client/` built (for relayer API calls — see `plans/shared-library.md`)
- npm workspace root `package.json` with `"workspaces": ["mcp-servers/*", "packages/*"]`
- `TAIKO_PRIVATE_KEY` (for write tools) or `TAIKO_MAINNET_PRIVATE_KEY` / `TAIKO_HOODI_PRIVATE_KEY` (separate keys per network)
- ABIs from `taikoxyz/taiko-mono/packages/protocol/artifacts/`

---

## Target File Structure

```
mcp-servers/taiko-bridge/
├── package.json                # @taikoxyz/mcp-bridge, version 0.1.0
├── tsconfig.json
├── src/
│   ├── index.ts                # Entry: stdio transport
│   ├── server.ts               # McpServer + tool registration
│   ├── networks.ts             # Network config (chain IDs, contract addresses)
│   ├── tools/
│   │   ├── read-tools.ts       # Read-only: status, fee, history, tokens
│   │   └── write-tools.ts      # Write: bridge_eth, bridge_erc20, retry, recall
│   ├── lib/
│   │   ├── clients.ts          # viem publicClient + walletClient factories
│   │   ├── bridge.ts           # IBridge contract interaction helpers
│   │   └── erc20vault.ts       # IERC20Vault contract interaction helpers
│   └── abis/
│       ├── IBridge.json        # From taikoxyz/taiko-mono artifacts
│       ├── IERC20Vault.json
│       └── ISignalService.json
└── tests/
    └── bridge.test.ts
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKO_PRIVATE_KEY` | Yes (write tools) | — | Signing key for bridge transactions |
| `TAIKO_MAINNET_PRIVATE_KEY` | No | falls back to `TAIKO_PRIVATE_KEY` | Mainnet-specific key |
| `TAIKO_HOODI_PRIVATE_KEY` | No | falls back to `TAIKO_PRIVATE_KEY` | Hoodi-specific key |
| `TAIKO_MAINNET_RPC` | No | `https://rpc.mainnet.taiko.xyz` | Mainnet RPC override |
| `TAIKO_HOODI_RPC` | No | `https://rpc.hoodi.taiko.xyz` | Hoodi RPC override |
| `TAIKO_L1_MAINNET_RPC` | No | `https://eth.drpc.org` | Ethereum L1 RPC for mainnet |
| `TAIKO_L1_HOODI_RPC` | No | `https://hoodi.drpc.org` | Ethereum Hoodi L1 RPC |

---

## Tools

### Read-Only Tools (safe for remote hosting)

| Tool | Description |
|------|-------------|
| `get_message_status` | Current relay status of a bridge message (NEW/RETRIABLE/DONE/FAILED/RECALLED) |
| `get_pending_messages` | Bridge messages for an address awaiting relay |
| `estimate_bridge_fee` | Relayer fee estimate for a given direction and amount |
| `list_supported_tokens` | Canonical token list for bridging (from relayer API) |
| `get_bridge_history` | Historical bridge operations for an address |

### Write Tools (local stdio only — require signing key)

| Tool | Description |
|------|-------------|
| `bridge_eth` | Send ETH L1→L2 or L2→L1 via IBridge.sendMessage |
| `bridge_erc20` | Bridge ERC-20 tokens via IERC20Vault.bridgeToken |
| `retry_message` | Retry a failed or stuck relay with updated fee |
| `recall_message` | Recall a failed message to get refund (srcOwner only) |

---

## Implementation Steps

### Step 1: Initialize package and install deps

```bash
mkdir -p mcp-servers/taiko-bridge/src/{tools,lib,abis}
cd mcp-servers/taiko-bridge
npm init -y
npm install @modelcontextprotocol/sdk viem zod @taikoxyz/taiko-api-client
npm install -D typescript tsx vitest @types/node
```

`package.json`:
```json
{
  "name": "@taikoxyz/mcp-bridge",
  "version": "0.1.0",
  "type": "module",
  "bin": { "taiko-bridge": "./dist/index.js" }
}
```

### Step 2: Source Taiko ABIs

```bash
# Download IBridge ABI from taiko-mono
curl -o src/abis/IBridge.json \
  https://raw.githubusercontent.com/taikoxyz/taiko-mono/main/packages/protocol/artifacts/contracts/bridge/IBridge.sol/IBridge.json

curl -o src/abis/IERC20Vault.json \
  https://raw.githubusercontent.com/taikoxyz/taiko-mono/main/packages/protocol/artifacts/contracts/tokenvault/IERC20Vault.sol/IERC20Vault.json
```

### Step 3: Network + client setup

```typescript
// src/networks.ts
import { defineChain } from "viem";

export const taikoMainnet = defineChain({
  id: 167000,
  name: "Taiko Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [process.env.TAIKO_MAINNET_RPC ?? "https://rpc.mainnet.taiko.xyz"] } },
});

export const BRIDGE_CONTRACTS = {
  mainnet: {
    l2Bridge: "0x1670000000000000000000000000000000000001" as const,
    l2SignalService: "0x1670000000000000000000000000000000000005" as const,
    l2ERC20Vault: "0x1670000000000000000000000000000000000002" as const,
  },
  hoodi: {
    l2Bridge: "0x167D000000000000000000000000000000000001" as const,
    l2SignalService: "0x167D000000000000000000000000000000000005" as const,
    l2ERC20Vault: "0x167D000000000000000000000000000000000002" as const,
  },
} as const;
```

### Step 4: Implement read-only tools (`read-tools.ts`)

**`get_message_status`**: Query relayer API `GET {relayer}/events/{msgHash}`. Fallback to on-chain `IBridge.messageStatus(msgHash)` call. Map uint8 → `["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"]`.

**`get_pending_messages`**: Query relayer API `GET {relayer}/events?address={addr}` filtered by status != DONE.

**`estimate_bridge_fee`**: Query relayer API `GET {relayer}/blockInfo` for current fee data. Note: exact endpoint needs verification against live relayer API.

**`list_supported_tokens`**: Query relayer for canonical token list. Fallback to static list from `taikoxyz/taiko-mono`.

**`get_bridge_history`**: Query relayer API `GET {relayer}/events?address={addr}`.

### Step 5: Implement write tools (`write-tools.ts`) with safety checks

**Security non-negotiables for ALL write tools:**
1. Always call `publicClient.simulateContract(...)` before `walletClient.writeContract(...)`
2. Reject if `TAIKO_PRIVATE_KEY` matches known test mnemonics (Hardhat default accounts)
3. Warn (log, don't block) if bridging > 1 ETH on mainnet
4. Use `TAIKO_MAINNET_PRIVATE_KEY` for mainnet, `TAIKO_HOODI_PRIVATE_KEY` for Hoodi — never cross-use

**`bridge_eth`** implementation:
```typescript
// Simulate first
const { request } = await publicClient.simulateContract({
  address: BRIDGE_CONTRACTS[network].l2Bridge,
  abi: IBridgeABI,
  functionName: "sendMessage",
  args: [{ /* IBridge.Message struct */ }],
  value: parseEther(amount) + fee,
  account,
});
// Then execute
const hash = await walletClient.writeContract(request);
```

**IBridge.Message struct**:
```typescript
interface BridgeMessage {
  id: bigint;          // auto-assigned by contract
  fee: bigint;         // relayer fee in wei
  gasLimit: number;    // gas for destChain execution
  from: Address;       // auto (msg.sender)
  srcChainId: bigint;  // auto
  srcOwner: Address;   // who can recall
  destChainId: bigint; // target chain
  destOwner: Address;  // who receives on dest
  to: Address;         // contract to call on dest
  value: bigint;       // ETH to send
  data: Hex;           // calldata
}
```

**`recall_message`**: Requires merkle proof from relayer API or storage trie. Query `{relayer}/events/{msgHash}` for proof data — never trust user-supplied proof data.

### Step 6: Claude Desktop configuration

```json
{
  "mcpServers": {
    "taiko-bridge": {
      "command": "npx",
      "args": ["-y", "@taikoxyz/mcp-bridge"],
      "env": {
        "TAIKO_PRIVATE_KEY": "0x...",
        "TAIKO_MAINNET_RPC": "https://rpc.mainnet.taiko.xyz"
      }
    }
  }
}
```

### Step 7: npm publish

```bash
npm run build && npm publish --access public
```

---

## Hosting

**v1 (initial)**: Local stdio only. All 9 tools run locally with private key in env.

**v2 (planned)**: Split — 5 read-only tools hosted on Cloudflare Workers (free tier), 4 write tools remain local stdio only. The CF Workers deployment wraps only the `read-tools.ts` subset.

**v1 cost**: $0 (local stdio)
**v2 cost**: $0 read tools (CF Workers free tier) + $0 write tools (local)

---

## Verification

With a real private key on Hoodi testnet:

1. `get_message_status` with a known Hoodi bridge tx hash — should return status string
2. `list_supported_tokens` on Hoodi — should return at least ETH and TAIKO
3. `estimate_bridge_fee` for `{amount: "0.01", direction: "L1_TO_L2", network: "hoodi"}` — should return fee in wei
4. `bridge_eth` with `{amount: "0.001", dest_chain: "hoodi"}` — should return tx hash (use small amount on testnet)
5. `get_bridge_history` for your address — should include the tx from step 4
6. After relay completes (~minutes on Hoodi): `get_message_status` should return `"DONE"`

---

## Research Notes

<!-- Merged from research_impl_taiko_bridge.md and research_impl_taiko_wallet.md — reference only -->

### Framework Decision
Build from scratch with TypeScript MCP SDK + viem v2. No existing bridge MCP exists for any EVM L2.

**Why viem over ethers.js v6**:
- `simulateContract` before every write tx (critical for safety)
- First-class TypeScript types with ABI inference
- Better tree-shaking for CF Workers
- `defineChain` for multi-network support
- More active maintenance (ethers.js v6 in maintenance mode)

### Bridge Message Status Flow
```
NEW → RETRIABLE → DONE (success)
NEW → RETRIABLE → FAILED → RECALLED (refund to srcOwner)
```
- 0 = NEW, 1 = RETRIABLE, 2 = DONE, 3 = FAILED, 4 = RECALLED

### L2→L1 Cooldown
- Mainnet: **24 hours** minimum before processMessage can be called on L1
- Hoodi: Shorter (verify exact duration from bridge UI or contract config)

### Relayer API Endpoints (verify against live API)
- `GET {relayer}/events?address={addr}` — bridge messages for address
- `GET {relayer}/events/{msgHash}` — specific message status
- `GET {relayer}/blockInfo` — L1/L2 sync status + fee data

### Wallet viem Patterns (from taiko-wallet research)
```typescript
// Chain definitions
export const taikoMainnet = defineChain({ id: 167000, ... });
export const taikoHoodi = defineChain({ id: 167013, ... });

// Nonce management for fast 2-6s blocks
let localNonce: number | null = null;
async function getNextNonce(address, publicClient) {
  if (localNonce === null) {
    localNonce = await publicClient.getTransactionCount({ address, blockTag: "pending" });
  }
  return localNonce++;
}
```

### EIP-7702 Notes (post-Gwyneth)
EIP-7702 is NOT yet live on Taiko (requires Gwyneth upgrade). Do not implement `batch_transactions` in bridge MCP. The `taiko-cli` will handle batch operations when Gwyneth lands, gated by `TAIKO_GWYNETH_ACTIVE=true`.

### Open Questions
| Question | Impact | How to Validate |
|----------|--------|-----------------|
| L1 Bridge contract address for L1→L2 | High | Check taiko-mono deployments file |
| ERC-20 Vault address on mainnet (inferred `0x1670...0002`) | High | Verify against Taikoscan |
| Exact Hoodi L2→L1 cooldown duration | Medium | Check Hoodi bridge UI |
| Relayer API schema for `estimate_bridge_fee` | Medium | Inspect bridge.taiko.xyz DevTools |
| Does `recall_message` require a merkle proof? | High | Check IBridge source in taiko-mono |
| ERC-20 Vault address on Hoodi (inferred `0x167D...0002`) | High | Verify from simple-taiko-node or Taikoscan |

### Contract Addresses
| Contract | Mainnet | Hoodi |
|----------|---------|-------|
| Bridge (L2) | `0x1670000000000000000000000000000000000001` | `0x167D000000000000000000000000000000000001` |
| SignalService (L2) | `0x1670000000000000000000000000000000000005` | `0x167D000000000000000000000000000000000005` |
| ERC20Vault (L2) | `0x1670000000000000000000000000000000000002` | `0x167D000000000000000000000000000000000002` |
| TaikoInbox (L1) | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` | TBD |
