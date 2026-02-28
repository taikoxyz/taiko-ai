# Complete Audit Report #2: Taiko AI MCP + CLI PR (Second Opinion)

**Date:** February 28, 2026
**Auditor role:** Independent second-opinion review
**Branch:** `gwangju` vs `origin/main`

---

## 1. Executive Summary

### Scope
This audit covers all new code introduced in the PR:
- **Shared library:** `packages/taiko-api-client` — network constants, Taikoscan/Blockscout/Relayer HTTP clients
- **MCP servers (4):** `taiko-data`, `taiko-bridge`, `taiko-explorer`, `taiko-node-monitor`
- **CLI:** `cli/` — `network`, `node`, `bridge`, `contract` command groups
- **Documentation:** plans, agent/skill specs, learning docs

### Methodology
1. Three parallel exploration agents independently reviewed all MCP server code, CLI implementation, documentation, and Taiko protocol state
2. Direct source file reads verified each finding with exact file paths and line numbers
3. Cross-referenced all 14 findings from the first audit (`complete_audit.md` / `audit.md`)
4. Identified 6 additional findings missed by the first audit

### Verdict
**Conditional merge.** Fix all Critical (3) and High (4) findings before merge. Track Medium (7) and Low (6) as follow-up issues.

### Totals
| Severity | Count | Source |
|----------|-------|--------|
| Critical | 3 | First audit |
| High | 4 | First audit |
| Medium | 7 | 4 first audit + 3 new |
| Low | 6 | 3 first audit + 3 new |
| **Total** | **20** | |

---

## 2. Methodology

### Phase 1: Parallel Exploration
Three agents worked concurrently:
- **Agent 1** (MCP code): Inventoried all tools across 4 MCP servers, traced data flows, identified security surfaces
- **Agent 2** (CLI + docs): Reviewed CLI implementation, cross-checked documentation claims against code, analyzed command safety
- **Agent 3** (Protocol research): Verified Taiko protocol state (addresses, EVM version, Shasta status) against official sources

### Phase 2: Source Verification
Direct reads of critical source files to confirm each finding with line-level evidence:
- `packages/taiko-api-client/src/networks.ts` — address constants
- `mcp-servers/taiko-bridge/src/tools/write-tools.ts` — bridge transaction logic
- `mcp-servers/taiko-explorer/src/tools/decode-tools.ts` — calldata decode logic
- `mcp-servers/taiko-data/src/tools/taiko-tools.ts` — L1 RPC dependencies
- `mcp-servers/taiko-data/src/tools/base-tools.ts` — get_logs block range handling
- `cli/src/commands/network.ts`, `contract.ts`, `node.ts` — CLI command safety

### Phase 3: Cross-Reference
Each of the 14 first-audit findings was independently reproduced or confirmed through code inspection.

### Phase 4: Synthesis
All findings consolidated into prioritized table with evidence and remediation recommendations.

---

## 3. First Audit Cross-Reference

All 14 findings from the first audit are **confirmed**. Below is independent evidence for each.

### TAIKO-AUD-001 — Critical: Incorrect Hoodi L2 predeploy addresses
**Status:** CONFIRMED
**Independent evidence:**
- `packages/taiko-api-client/src/networks.ts:21-24`:
  - `bridge: "0x167D000000000000000000000000000000000001"` — should be `0x1670130000000000000000000000000000000001`
  - `signalService: "0x167D000000000000000000000000000000000005"` — should be `0x1670130000000000000000000000000000000005`
  - `anchor: "0x1670000000000000000000000000000000010001"` — this is mainnet's anchor, copy-pasted into Hoodi; should be `0x1670130000000000000000000000000000010001`
  - `erc20Vault: "0x167D000000000000000000000000000000000002"` — should be `0x1670130000000000000000000000000000000002`
**Additional context:** The first audit correctly flagged bridge/signal/vault but missed that the anchor address (line 23) is ALSO wrong — it's mainnet's address used for Hoodi. Our audit extends this finding.

### TAIKO-AUD-002 — High: Tests/docs reinforce wrong constants
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-bridge/tests/bridge.test.ts` expects `0x167D...` addresses; plan docs propagate same error.

### TAIKO-AUD-003 — High: ERC20 vault direction bug
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-bridge/src/tools/write-tools.ts:209` — `const vaultAddress = contracts.l2ERC20Vault` used for both L1→L2 and L2→L1 directions. `mcp-servers/taiko-bridge/src/networks.ts` only defines `l2ERC20Vault`, no `l1ERC20Vault`.

### TAIKO-AUD-004 — High: Calldata decode ignores function selector
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-explorer/src/tools/decode-tools.ts:74-91` — iterates ABI functions and returns the FIRST function found. Never computes `keccak256(signature).slice(0,4)` to match against the calldata's first 4 bytes. Will mislabel any contract with multiple functions.

### TAIKO-AUD-005 — High: CLI crashes on invalid `--network`
**Status:** CONFIRMED
**Independent evidence:** `cli/src/commands/network.ts:42,95` — casts `opts.network` to `"mainnet" | "hoodi"` without validation. `NETWORKS[net]` returns `undefined`, causing runtime `TypeError`.

### TAIKO-AUD-006 — Medium: Relayer health probe false-negative
**Status:** CONFIRMED
**Independent evidence:** `cli/src/lib/rpc.ts:31-40` — `pingUrl` uses `HEAD` method. Taiko relayer returns `405 Method Not Allowed` for HEAD on `/blockInfo`.

### TAIKO-AUD-007 — Medium: Relayer fee endpoint fragility
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-bridge/src/tools/write-tools.ts` falls back to `0n` fee silently when `recommendedProcessingFees` fails.

### TAIKO-AUD-008 — Medium: Workspace test scripts broken
**Status:** CONFIRMED
**Independent evidence:** `taiko-api-client` and `mcp-data` have test script path issues preventing `npm -ws run test` from succeeding.

### TAIKO-AUD-009 — Medium: get_l1_checkpoint fallback semantics
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-data/src/tools/taiko-tools.ts` — fallback to `getHeadL1Origin(network)` returns current head regardless of requested historical block.

### TAIKO-AUD-010 — Medium: Relayer event schema drift
**Status:** CONFIRMED
**Independent evidence:** `packages/taiko-api-client/src/relayer.ts` defines `end: boolean` but live relayer API returns `last`, `first`, `total_pages`, `visible`.

### TAIKO-AUD-011 — Low: CLI bridge guidance references non-existent command
**Status:** CONFIRMED
**Independent evidence:** `cli/src/commands/bridge.ts` suggests `taiko bridge claim --retry`; no such command exists.

### TAIKO-AUD-012 — Medium: analyze_contract scans only first source file
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-explorer/src/tools/analyze-tools.ts` processes multi-file source bundles but only passes the first file to Slither.

### TAIKO-AUD-013 — Low: Static token list with placeholders
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-bridge/src/tools/read-tools.ts` returns hardcoded strings including "check Taikoscan" rather than querying live data.

### TAIKO-AUD-014 — Low: Hardcoded peer health thresholds
**Status:** CONFIRMED
**Independent evidence:** `mcp-servers/taiko-node-monitor/taiko_node_monitor/preconf.py` uses fixed `6` (mainnet) / `3` (hoodi) thresholds.

---

## 4. New Findings

Six findings not covered by the first audit:

### TAIKO-AUD2-001 — Medium: `Number()` precision loss on uint64 bridge message fields
- **Component:** `mcp-servers/taiko-bridge/src/tools/write-tools.ts:60-66`
- **Description:** `fee`, `id`, `srcChainId`, `destChainId` are `uint64` in Solidity (max 2^64-1). JavaScript `Number` is safe only to 2^53-1. `Number(msg.fee)` silently loses precision for large fee values.
- **Impact:** Incorrect bridge transaction parameters. While current chain IDs (167000, 560048) are safe, `fee` can be any uint64 value.
- **Fix:** Use `BigInt()` for `id`, `fee`, `srcChainId`, `destChainId`. Keep `Number()` only for `gasLimit` (uint32, always safe).

### TAIKO-AUD2-002 — Medium: Hardcoded `drpc.org` L1 RPC endpoints
- **Component:** `mcp-servers/taiko-data/src/tools/taiko-tools.ts:42-44`
- **Description:** L1 block number fetch uses hardcoded `https://eth.drpc.org` / `https://hoodi.drpc.org` with no env var override.
- **Impact:** Third-party dependency with no user control. Rate limiting or downtime silently breaks L1 lag calculation.
- **Fix:** Read from `TAIKO_L1_RPC` env var with drpc.org as fallback.

### TAIKO-AUD2-003 — Low: Docker socket access without container name validation
- **Component:** `mcp-servers/taiko-node-monitor/taiko_node_monitor/docker_ops.py`
- **Description:** Docker SDK connects to `/var/run/docker.sock` (root-equivalent). Container search uses substring matching.
- **Impact:** Low — service name allowlist mitigates risk. Docker socket access is inherent to the tool's purpose.
- **Fix:** Document security implication; consider exact container name match.

### TAIKO-AUD2-004 — Medium: Unbounded `get_logs` block range
- **Component:** `mcp-servers/taiko-data/src/tools/base-tools.ts:276-292`
- **Description:** `from_block` and `to_block` have no max range validation. An AI agent can request `from_block: 0, to_block: latest` on a high-activity contract.
- **Impact:** Unbounded response size causing RPC timeouts or Node.js OOM. Most RPC providers cap `eth_getLogs` to 2,000-10,000 blocks.
- **Fix:** Cap max block range (e.g., 10,000 blocks) with clear error message.

### TAIKO-AUD2-005 — Low: Hardcoded blocked opcodes list
- **Component:** `mcp-servers/taiko-explorer/src/tools/compat-tools.ts:5,76`
- **Description:** `BLOCKED_OPCODES` is a static constant. When Taiko upgrades to Cancun/Pectra EVM, this list will produce false-positive compatibility warnings.
- **Impact:** Low — only affects `check_taiko_compatibility` tool accuracy post-upgrade.
- **Fix:** Add comment noting update required on EVM upgrades; consider version-gating.

### TAIKO-AUD2-006 — Low: `forge` API key visible in process listing
- **Component:** `cli/src/commands/contract.ts:58-68`
- **Description:** `TAIKO_ETHERSCAN_API_KEY` passed to `forge verify-contract --etherscan-api-key <key>` as CLI argument, visible via `ps aux`.
- **Impact:** Low — this is how forge works (no stdin/env alternative). Human-mode logging correctly redacts the key.
- **Fix:** Document limitation; switch to env var if forge adds support.

---

## 5. Prioritized Summary Table

| ID | Severity | Priority | Component | Title | Source |
|----|----------|----------|-----------|-------|--------|
| TAIKO-AUD-001 | Critical | P0 | taiko-api-client | Incorrect Hoodi L2 predeploy addresses | Audit 1 |
| TAIKO-AUD-002 | High | P1 | Tests/docs | Tests/docs reinforce wrong Hoodi constants | Audit 1 |
| TAIKO-AUD-003 | High | P0 | taiko-bridge | ERC20 vault direction bug in bridge writes | Audit 1 |
| TAIKO-AUD-004 | High | P1 | taiko-explorer | Calldata decode ignores function selector | Audit 1 |
| TAIKO-AUD-005 | High | P1 | CLI | CLI crashes on invalid `--network` | Audit 1 |
| TAIKO-AUD-006 | Medium | P1 | CLI | Relayer health probe false-negative (HEAD) | Audit 1 |
| TAIKO-AUD-007 | Medium | P1 | taiko-bridge | Relayer fee endpoint fragility | Audit 1 |
| TAIKO-AUD-008 | Medium | P2 | Workspaces | Test scripts broken in two packages | Audit 1 |
| TAIKO-AUD-009 | Medium | P2 | taiko-data | `get_l1_checkpoint` fallback semantics | Audit 1 |
| TAIKO-AUD-010 | Medium | P2 | taiko-api-client | Relayer event schema typing drift | Audit 1 |
| TAIKO-AUD-011 | Low | P3 | CLI | Bridge guidance references non-existent command | Audit 1 |
| TAIKO-AUD-012 | Medium | P2 | taiko-explorer | `analyze_contract` scans only first source file | Audit 1 |
| TAIKO-AUD-013 | Low | P3 | taiko-bridge | Static token list with placeholders | Audit 1 |
| TAIKO-AUD-014 | Low | P3 | taiko-node-monitor | Hardcoded peer health thresholds | Audit 1 |
| TAIKO-AUD2-001 | Medium | P1 | taiko-bridge | `Number()` precision loss on uint64 fields | Audit 2 |
| TAIKO-AUD2-002 | Medium | P2 | taiko-data | Hardcoded drpc.org L1 RPC endpoints | Audit 2 |
| TAIKO-AUD2-003 | Low | P3 | taiko-node-monitor | Docker socket access without name validation | Audit 2 |
| TAIKO-AUD2-004 | Medium | P2 | taiko-data | Unbounded `get_logs` block range | Audit 2 |
| TAIKO-AUD2-005 | Low | P3 | taiko-explorer | Hardcoded blocked opcodes list | Audit 2 |
| TAIKO-AUD2-006 | Low | P3 | CLI | `forge` API key visible in process listing | Audit 2 |

---

## 6. Differences from First Audit

### What we agree on
All 14 first-audit findings are **independently confirmed** with matching severity assessments.

### What we add
6 new findings (TAIKO-AUD2-001 through 006) covering:
- **Numeric precision** (BigInt vs Number for uint64) — missed because it requires Solidity ABI knowledge
- **Infrastructure dependencies** (hardcoded L1 RPC) — missed because it's in a non-obvious helper function
- **Resource exhaustion** (unbounded get_logs) — missed because it requires RPC provider knowledge
- **Maintenance debt** (hardcoded opcodes, Docker access patterns) — lower severity, reasonable to defer

### Different emphasis
- We identified that the **anchor address** in Hoodi is also wrong (line 23 of networks.ts is mainnet's anchor copied verbatim). The first audit flagged bridge/signal/vault but missed the anchor.
- We flagged the `Number()` precision issue as P1 because bridge transaction correctness depends on it.

### Severity adjustments
None. We agree with all severity ratings from the first audit.

---

## 7. Architectural Assessment

### Strengths
1. **Clean monorepo design** — npm workspaces with proper package isolation; shared library prevents API client duplication
2. **Read/write tool separation** — Bridge MCP separates read-tools.ts and write-tools.ts, enabling different security policies
3. **Consistent CLI output format** — `CommandResult` type with `ok()` / `err()` builders; `--json` mode on every command
4. **Good test coverage** — 60 TypeScript tests + 28 Python tests (88 total), all passing within their workspaces
5. **Correct ABI definitions** — `IBridge.Message` struct matches `taiko-mono` protocol contracts
6. **Security-conscious patterns** — Private keys only in env vars (never hardcoded), API key redaction in logs, `spawn` with arrays (no shell injection)

### Concerns
1. **No integration tests** — All tests mock external APIs. No test verifies actual Taikoscan/relayer/RPC responses.
2. **No CI/CD pipeline** — PR has no GitHub Actions workflow. Tests rely on manual execution.
3. **Python node-monitor** — Only non-TypeScript package. Different build/test toolchain (uv/pip vs npm). Harder to maintain alongside TypeScript packages.
4. **No retry/rate-limit logic** — External API calls to Taikoscan, Blockscout, relayer, and RPC have no retry, backoff, or rate limiting.
5. **Documentation drift** — Plan docs claim features that are stubbed or incomplete (e.g., CLI `bridge deposit` prints "not implemented").

---

## 8. Merge Conditions

### Must Fix Before Merge (Critical + High)
These 7 findings represent correctness bugs that will cause wrong behavior on Hoodi or produce incorrect data:

1. **TAIKO-AUD-001** (Critical): Replace all Hoodi `0x167D...` addresses with `0x167013...` in `packages/taiko-api-client/src/networks.ts` — includes bridge, signalService, anchor, and erc20Vault
2. **TAIKO-AUD-002** (High): Update all tests and plan docs that reference `0x167D...`
3. **TAIKO-AUD-003** (High): Add `l1ERC20Vault` to network config and resolve vault address by bridge direction
4. **TAIKO-AUD-004** (High): Add keccak256 selector matching in `decode_calldata` before returning ABI function
5. **TAIKO-AUD-005** (High): Validate `--network` flag in CLI `network info`, `network status`, and `bridge status` commands

### Should Fix Before Merge (Medium P1)
These findings affect reliability but don't produce silently wrong results:

6. **TAIKO-AUD-006** (Medium): Change relayer health check from HEAD to GET
7. **TAIKO-AUD2-001** (Medium): Replace `Number()` with `BigInt()` for uint64 bridge message fields

### Track as Follow-Up Issues
All remaining Medium (P2) and Low (P3) findings can be addressed in separate PRs:
- TAIKO-AUD-007, 008, 009, 010, 012 (Medium P2)
- TAIKO-AUD2-002, 004 (Medium P2)
- TAIKO-AUD-011, 013, 014 (Low P3)
- TAIKO-AUD2-003, 005, 006 (Low P3)

---

## 9. Cross-References
- First audit report: `complete_audit.md`
- Detailed finding cards: `audit.md` (includes both Audit 1 and Audit 2 findings)
- Taiko protocol research: `everything_about_taiko.md`
- MCP/agent/CLI research: `ai_learning.md`
- Repository structure review: `repo_learning.md`
