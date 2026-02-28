# Complete Audit Report #3: Taiko AI MCP + CLI PR (Third Independent Audit)

**Date:** February 28, 2026  
**Auditor role:** Independent third-pass review (security, architecture, reliability, testing)  
**Branch context:** `taiko-mcp` working tree

## Quick Summary

### Outstanding Issues by Priority
- **P0:** 0
- **P1:** 2
- **P2:** 8
- **P3:** 6

### Top blockers
1. **TAIKO-AUD-005 (P1):** Invalid `--network` still causes hard crash in `taiko contract verify` (`cli/src/commands/contract.ts:42-43`, `:66-67`; reproduced at runtime).
2. **TAIKO-AUD3-001 (P1):** `taiko bridge deposit` returns top-level `status: "success"` while explicitly `status: "not_implemented"` (`cli/src/commands/bridge.ts:106-115`), creating false-positive automation success.

---

## 1. Executive Summary

### Verdict
**Block merge until P1 issues are fixed.**

After those are fixed, merge can be conditional on a short P2 cleanup pass (notably JSON contract consistency, range-limit correctness, and CI test gating).

### Validation performed
- **Build:** `npm -ws run build` ✅ (all TypeScript workspaces build).
- **TypeScript tests:** `npm -ws run test` ❌ (fails at `@taikoxyz/taiko-api-client`: no test files).
- **Python tests:** `pytest -q` in `mcp-servers/taiko-node-monitor` ✅ (28 passed).
- **Runtime repro checks:**
  - `taiko contract verify ... --network bad --json` => TypeError crash ✅ reproduced.
  - `taiko bridge deposit ... --json` => returns `status: success` + `status: not_implemented` ✅ reproduced.
  - `taiko node logs --json` with bad `COMPOSE_DIR` => plain text error, not JSON ✅ reproduced.

### Overall design challenge
The PR still carries unnecessary surface duplication across sub-packages:
- Bridge status is implemented in **three places** with divergent schemas (`cli`, `mcp-data`, `mcp-bridge`).
- Node operations are split across **TypeScript CLI** and **Python MCP**.

This fragmentation is the main long-term reliability and maintenance risk, not individual syntax bugs.

---

## 2. Delta vs `complete_audit2.md`

### Newly discovered issues (Audit #3)
- **TAIKO-AUD3-001 (P1):** `bridge deposit` reports success despite being non-functional.
- **TAIKO-AUD3-002 (P2):** `node logs --json` violates CLI JSON output contract.
- **TAIKO-AUD3-003 (P2):** `mcp-bridge get_message_status` returns numeric status on relayer path despite label contract.
- **TAIKO-AUD3-004 (P2):** Missing uint64 overflow guard for ERC20 relayer fee.
- **TAIKO-AUD3-005 (P3):** `get_peer_count` hardcodes mainnet threshold (`>=6`) with no Hoodi-aware threshold.
- **TAIKO-AUD3-006 (P2):** Tool/sub-package overlap causes schema and behavior drift.
- **TAIKO-AUD3-007 (P2):** CI workflow formats code but does not run build/tests.

### Resolved since Audit #2
- **TAIKO-AUD-001:** Hoodi predeploy addresses corrected (`packages/taiko-api-client/src/networks.ts:21-24`).
- **TAIKO-AUD-003:** ERC20 vault direction resolved (`mcp-servers/taiko-bridge/src/networks.ts:57-70`, `write-tools.ts:188-190`).
- **TAIKO-AUD-004:** Calldata selector matching implemented (`mcp-servers/taiko-explorer/src/tools/decode-tools.ts:77-84`).
- **TAIKO-AUD-006:** Relayer health probe uses GET (`cli/src/lib/rpc.ts:26-33`).
- **TAIKO-AUD-011:** Non-existent retry CLI guidance removed.
- **TAIKO-AUD-012:** Multi-file source handling for Slither added (`mcp-servers/taiko-explorer/src/tools/analyze-tools.ts:134-141`).
- **TAIKO-AUD-014:** Preconf thresholds now env-configurable (`mcp-servers/taiko-node-monitor/taiko_node_monitor/preconf.py:74-79`).
- **TAIKO-AUD2-001:** uint64 `Number()` precision issue fixed with `BigInt` conversions (`write-tools.ts:51-57`).
- **TAIKO-AUD2-002:** L1 RPC supports env override (`taiko-tools.ts:40-41`).
- **TAIKO-AUD2-003:** Docker container lookup now strict + allowlisted (`docker_ops.py:39-47`).

### Disagreements / misclassifications vs Audit #2
- **TAIKO-AUD-005:** Was treated as generally fixed; still reproducible in `contract verify` path.
- **TAIKO-AUD2-004:** Range cap added, but bypass still exists when `to_block` omitted.
- **TAIKO-AUD-009:** Severity should be downgraded (now explicit warning prevents silent wrong data: `taiko-tools.ts:102-113`).
- **TAIKO-AUD-002:** Tests are corrected, but plan/docs still stale (`plan.md:167-169`), so not fully resolved.

---

## 3. Outstanding Findings (Current)

### P1

#### TAIKO-AUD-005 — Invalid network crash remains in contract command
- **Evidence:** `cli/src/commands/contract.ts:42-43`, `:66-67`.
- **Runtime proof:** invalid `--network` causes `TypeError: Cannot read properties of undefined (reading 'chainId')`.
- **Impact:** command exits with stack trace (non-structured failure path).

#### TAIKO-AUD3-001 — Bridge deposit reports success while not implemented
- **Evidence:** `cli/src/commands/bridge.ts:106-115`.
- **Runtime proof:** returns JSON `status: "success"` and `data.status: "not_implemented"`.
- **Impact:** automation can proceed as if bridging succeeded when no transaction occurred.

### P2

#### TAIKO-AUD-007 — Relayer fee fallback to zero remains fragile
- **Evidence:** `mcp-servers/taiko-bridge/src/tools/write-tools.ts:27`, `:34-35`.
- **Impact:** temporary relayer/API issues silently produce unrealistic fee assumptions.

#### TAIKO-AUD-008 — Workspace test run still not green
- **Evidence:** `packages/taiko-api-client/package.json:17` with no test files in package.
- **Impact:** `npm -ws run test` fails in routine CI/local validation.

#### TAIKO-AUD2-004 — `get_logs` range cap is bypassable
- **Evidence:** `mcp-servers/taiko-data/src/tools/base-tools.ts:304-305`, `:314-315`.
- **Issue:** cap only applies when both bounds provided; `from_block` + implicit latest remains unbounded.

#### TAIKO-AUD3-002 — `node logs --json` does not honor JSON contract
- **Evidence:** `cli/src/commands/node.ts:182-203`.
- **Impact:** `--json` users receive plain logs/errors, breaking machine parsing.

#### TAIKO-AUD3-003 — Bridge status schema mismatch in mcp-bridge
- **Evidence:** tool says string statuses (`read-tools.ts:34-36`) but relayer path returns numeric (`:59`).
- **Impact:** inconsistent semantics across similar tools.

#### TAIKO-AUD3-004 — Missing uint64 guard on ERC20 relay fee
- **Evidence:** ETH path has guard (`write-tools.ts:99-101`), ERC20 path lacks equivalent before `op.fee` assignment (`:194`, `:197-205`).
- **Impact:** potential runtime revert / malformed assumptions on oversized fee inputs.

#### TAIKO-AUD3-006 — Overlapping tools/sub-packages are drifting
- **Evidence:**
  - CLI bridge status mapping: `cli/src/commands/bridge.ts:42-49`
  - MCP data bridge status: `mcp-servers/taiko-data/src/tools/taiko-tools.ts:141-161`
  - MCP bridge status: `mcp-servers/taiko-bridge/src/tools/read-tools.ts:33-61`
  - CLI node ops: `cli/src/commands/node.ts:30-226`
  - Python node MCP ops: `mcp-servers/taiko-node-monitor/taiko_node_monitor/server.py:34-127`
- **Impact:** duplicate business logic with inconsistent output contracts and higher maintenance cost.

#### TAIKO-AUD3-007 — CI does not gate correctness
- **Evidence:** `.github/workflows/format.yml:28-43` runs format/lint-fix only; no build/test jobs.
- **Impact:** regressions can merge despite passing only style checks.

### P3

#### TAIKO-AUD-002 — Stale plan/docs constants persist
- **Evidence:** `plan.md:167-169` still uses obsolete Hoodi `0x167D...` values.

#### TAIKO-AUD-010 — Deprecated relayer pagination field still consumed
- **Evidence:** `cli/src/commands/bridge.ts:150` uses `events.end` while client documents `last/first/...` (`packages/taiko-api-client/src/relayer.ts:46-52`).

#### TAIKO-AUD-013 — Token support list remains partly placeholder-based
- **Evidence:** `mcp-servers/taiko-bridge/src/tools/read-tools.ts:218-225`, `:240-242`.

#### TAIKO-AUD2-005 — Blocked opcode set remains static (mitigated)
- **Evidence:** static map remains (`mcp-servers/taiko-explorer/src/lib/opcodes.ts:11-17`), but maintenance warning added (`:6-9`).

#### TAIKO-AUD2-006 — Forge API key visible in process args (documented limitation)
- **Evidence:** `cli/src/commands/contract.ts:58-60`, args include key (`:68-69`).

#### TAIKO-AUD3-005 — Node monitor peer threshold is not network-aware
- **Evidence:** `mcp-servers/taiko-node-monitor/taiko_node_monitor/server.py:56-60` hardcodes `count >= 6`.

---

## 4. Updated Findings Table

| ID | Severity | Status | Notes |
|---|---|---|---|
| TAIKO-AUD-001 | P0 | **Resolved** | Hoodi predeploy constants corrected in shared network config. |
| TAIKO-AUD-002 | P3 | **Partially resolved** | Tests fixed; plan/docs still contain stale `0x167D...` constants. |
| TAIKO-AUD-003 | P1 | **Resolved** | ERC20 vault direction selection fixed with `l1ERC20Vault`/`l2ERC20Vault`. |
| TAIKO-AUD-004 | P1 | **Resolved** | Selector-based ABI function match implemented. |
| TAIKO-AUD-005 | P1 | **Open** | Still crashes for invalid `--network` in contract verify flow. |
| TAIKO-AUD-006 | P2 | **Resolved** | HEAD -> GET health probe change landed. |
| TAIKO-AUD-007 | P2 | **Open** | Fee endpoint failure still silently defaults to zero fee. |
| TAIKO-AUD-008 | P2 | **Partially resolved** | Script path fixes landed; workspace test command still fails overall. |
| TAIKO-AUD-009 | P3 | **Mitigated** | Fallback now explicitly warns it is HEAD, not requested historical block. |
| TAIKO-AUD-010 | P3 | **Open** | CLI still references deprecated `end` pagination field. |
| TAIKO-AUD-011 | P3 | **Resolved** | Non-existent retry command reference removed. |
| TAIKO-AUD-012 | P2 | **Resolved** | Multi-file contract analysis now writes all sources. |
| TAIKO-AUD-013 | P3 | **Open** | Token list still includes placeholders/manual lookup text. |
| TAIKO-AUD-014 | P3 | **Resolved** | Preconf threshold now configurable by env. |
| TAIKO-AUD2-001 | P1 | **Resolved** | uint64 fields now parsed with `BigInt`. |
| TAIKO-AUD2-002 | P2 | **Resolved** | L1 RPC endpoint now overrideable via env vars. |
| TAIKO-AUD2-003 | P3 | **Resolved** | Docker lookup now strict service-label based with allowlist. |
| TAIKO-AUD2-004 | P2 | **Partially resolved** | Block range cap bypass still possible when `to_block` omitted. |
| TAIKO-AUD2-005 | P3 | **Mitigated** | Static list remains, but maintenance annotations added. |
| TAIKO-AUD2-006 | P3 | **Open** | API key remains visible in process args (tool limitation). |
| TAIKO-AUD3-001 | P1 | **Open (new)** | `bridge deposit` returns success while non-functional. |
| TAIKO-AUD3-002 | P2 | **Open (new)** | `node logs --json` is not JSON-safe / ignores option semantics. |
| TAIKO-AUD3-003 | P2 | **Open (new)** | `get_message_status` relayer branch returns numeric status unexpectedly. |
| TAIKO-AUD3-004 | P2 | **Open (new)** | ERC20 bridge path lacks uint64 guard on fee field. |
| TAIKO-AUD3-005 | P3 | **Open (new)** | Node monitor `get_peer_count` threshold hardcoded for mainnet behavior. |
| TAIKO-AUD3-006 | P2 | **Open (new)** | Tool/sub-package overlap causing implementation/schema drift. |
| TAIKO-AUD3-007 | P2 | **Open (new)** | CI lacks build/test gating; format-only workflow. |

---

## 5. Merge Conditions

### Must fix before merge
1. TAIKO-AUD-005
2. TAIKO-AUD3-001

### Strongly recommended in same PR (stability)
1. TAIKO-AUD2-004
2. TAIKO-AUD3-002
3. TAIKO-AUD3-003
4. TAIKO-AUD3-004
5. TAIKO-AUD3-007

### Design follow-up (sub-package necessity)
1. Consolidate duplicated bridge status logic behind one shared contract in `packages/taiko-api-client`.
2. Decide one primary node-operations surface (CLI vs Python MCP) or formalize one as thin wrapper over the other.
3. Remove or fully implement stub commands (`bridge deposit`) to avoid false-success semantics.
