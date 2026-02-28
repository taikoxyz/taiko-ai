# Audit Findings — PR #12 (taiko-mcp)

PR: "Add Taiko MCP servers, API client, CLI, and audit docs"
Branch: `taiko-mcp` targeting `main`

---

## Bugs

### 1. `retry_message` sends transaction to the wrong chain

**Severity:** High
**File:** `mcp-servers/taiko-bridge/src/tools/write-tools.ts:269`

The direction mapping is inverted. When `chain="l2"` (default, for L1→L2 messages), it maps to `dir="L1_TO_L2"`, which `resolveChain`/`resolveBridgeAddress` resolve to L1 — the source chain, not the destination. `retryMessage` must be called on the destination chain's bridge contract.

**Fix:** Swap the ternary:

```typescript
// Before (broken)
const dir: BridgeDirection = chain === "l1" ? "L2_TO_L1" : "L1_TO_L2";
// After (correct)
const dir: BridgeDirection = chain === "l1" ? "L1_TO_L2" : "L2_TO_L1";
```

### 2. `contract verify` uses deprecated verifier URL

**Severity:** High
**File:** `cli/src/commands/contract.ts:79`

Constructs `https://taikoscan.io/api` as `--verifier-url`. This endpoint returns `"Invalid API URL endpoint"`. The correct endpoint is the Etherscan V2 API, already defined in `networks.ts` but unused here.

**Fix:** Replace with:

```typescript
`${netConfig.etherscanV2}?chainid=${netConfig.chainId}`
```

Ref: https://docs.taiko.xyz/guides/app-developers/verify-a-contract/

### 3. `l1_block_height` returned as hex string instead of integer

**Severity:** Medium
**File:** `mcp-servers/taiko-node-monitor/taiko_node_monitor/rpc.py:44`

`taiko_headL1Origin` returns hex-encoded values. Every other hex value in `rpc.py` is parsed with `int(..., 16)`, but `l1BlockHeight` is assigned raw. The field will be a string like `"0x13a52b"` at runtime despite the `int | None` type annotation.

**Fix:**

```python
raw = l1_origin.get("l1BlockHeight")
l1_block_height = int(raw, 16) if raw else None
```

---

## CLAUDE.md / RULES.md Violations

### 4. Placeholder `bridge deposit` command

**Severity:** Medium
**File:** `cli/src/commands/bridge.ts:74-103`
**Rule:** Implementation Completeness (RULES.md) — "No Partial Features", "No Mock Objects"

The command is registered with options (`--token`, `--to`, `--fee`) but unconditionally exits with "This command is not implemented yet." Either implement it or remove the command registration entirely.

### 5. Unverifiable marketing claim in tool description

**Severity:** Low
**File:** `mcp-servers/taiko-explorer/src/tools/compat-tools.ts:42`
**Rule:** Professional Honesty (RULES.md) — "No Marketing Language", "Evidence-Based Claims"

"This is the only tool of its kind for any L2 blockchain" — unverifiable superlative. Remove or replace with a factual description.

---

## Token Efficiency / Payload Size

### 6. ABIs returned as full JSON — truncate to function signatures

**Severity:** Medium
**Files:** `mcp-servers/taiko-explorer/src/tools/abi-tools.ts:84`, `mcp-servers/taiko-data/src/tools/base-tools.ts:153`

Both `get_contract_abi` tools return the entire parsed ABI array verbatim. A verified contract ABI can be very large. Returning only `{ name, type, selector }` per entry would be significantly more token-efficient for LLM consumers.

### 7. `get_contract_source` returns unbounded source code

**Severity:** Medium
**File:** `mcp-servers/taiko-explorer/src/tools/abi-tools.ts:91-113`

Returns the full Taikoscan `getsourcecode` response (Solidity source, compiler settings, full ABI again) with no truncation or summary mode. Multi-file projects can produce megabytes of output. Add a `max_length` param or return a summary (file list + line counts) by default.

### 8. `get_token_transfers` and `get_nft_holdings` lack pagination

**Severity:** Medium
**Files:** `mcp-servers/taiko-data/src/tools/base-tools.ts:194-214` (token transfers), `mcp-servers/taiko-data/src/tools/taiko-tools.ts:219+` (NFT holdings)

Neither tool exposes `page` or `limit` parameters. `getTokenTransfers` hardcodes `offset: "25", page: "1"` and `getNFTHoldings` hardcodes `page: "1", offset: "50"` in the API client. Callers cannot paginate past the first page.

### 9. `get_pending_messages` fetches 100 records then filters client-side

**Severity:** Low
**File:** `mcp-servers/taiko-bridge/src/tools/read-tools.ts:139-164`

Requests `size=100` from the relayer API, then filters to status 0 (NEW) or 1 (RETRIABLE). The relayer API doesn't support server-side status filtering, but the page size should be lower (the `RelayerClient` default is 25) and exposed as a configurable parameter. Also, there is no multi-page loop, so pending messages beyond position 100 are silently missed.
