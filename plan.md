# Taiko AI — Implementation Plan

This document tracks all planned MCPs and CLI tooling for the `taikoxyz/taiko-ai` repository. Each item links to a dedicated in-depth plan file that contains production-readiness implementation steps, file structures, verification procedures, and merged research notes.

**Decision**: Build **both MCPs and a CLI** — they serve different audiences. MCP tool calls in Claude Desktop/Code are native and zero-overhead; CLI via Bash works in all AI frameworks (LangChain, AutoGPT, etc.) and is human-friendly. Phase 1 MCPs ship first (already researched and planned), CLI ships in Phase 3.

---

## Priority Matrix

| # | Item | Phase | Type | Hosting | Status | Plan |
|---|------|-------|------|---------|--------|------|
| 0 | Shared API Client | Pre-req | Library | npm package | [x] Built — `packages/taiko-api-client/` | [plans/shared-library.md](plans/shared-library.md) |
| 1 | taiko-data MCP | Phase 1 | MCP | Cloudflare Workers | [x] Built — `mcp-servers/taiko-data/`, needs API key + deploy | [plans/taiko-data-mcp.md](plans/taiko-data-mcp.md) |
| 2 | taiko-node-monitor MCP | Phase 1 | MCP | Local stdio | [x] Built — `mcp-servers/taiko-node-monitor/`, distribute via `uvx taiko-node-monitor` | [plans/taiko-node-monitor-mcp.md](plans/taiko-node-monitor-mcp.md) |
| 3 | taiko-bridge MCP | Phase 2 | MCP | Local stdio (write) / CF Workers (read) | [x] Built — `mcp-servers/taiko-bridge/`, 9 tools (5 read + 4 write), 18/18 tests pass | [plans/taiko-bridge-mcp.md](plans/taiko-bridge-mcp.md) |
| 4 | taiko-explorer MCP | Phase 2 | MCP | CF Workers (6 tools) / Railway (analyze) | [x] Built — `mcp-servers/taiko-explorer/`, 9 tools, 18/18 tests pass | [plans/taiko-explorer-mcp.md](plans/taiko-explorer-mcp.md) |
| 5 | taiko CLI | Phase 3 | CLI | Local binary / npm | [ ] Not started | [plans/taiko-cli.md](plans/taiko-cli.md) |

---

## Shared Infrastructure (Prerequisite)

**[`@taikoxyz/taiko-api-client`](plans/shared-library.md)** — TypeScript npm package providing typed HTTP clients for Taikoscan, Blockscout v2, and the Taiko Relayer. Used by taiko-data, taiko-bridge, taiko-explorer, and the CLI. Build this first.

```
packages/taiko-api-client/
├── src/networks.ts      # Network constants (chain IDs, contract addresses, API URLs)
├── src/taikoscan.ts     # Etherscan-compatible API client
├── src/blockscout.ts    # Blockscout v2 REST API client
└── src/relayer.ts       # Taiko bridge relayer API client
```

---

## Phase 1: Immediate MCPs

### 1. [taiko-data MCP](plans/taiko-data-mcp.md)
**On-chain data query MCP for Taiko Mainnet + Hoodi** ✅ Built

- **Base**: Built from scratch with TypeScript MCP SDK + ethers.js v6 (Taikoscan V1 deprecated; mcp-ethers-server not suitable as base)
- **API**: Etherscan V2 (`api.etherscan.io/v2/api?chainid=167000`) — same key as `$ETHERSCAN_API_KEY`
- **Tools (16 total)**: 11 base tools (`get_balance`, `get_transactions`, `get_block_info`, `get_transaction_info`, `get_contract_abi`, `read_contract`, `get_token_transfers`, `get_gas_price`, `get_block_number`, `get_transaction_count`, `get_logs`) + 5 Taiko-specific (`get_l1_checkpoint`, `get_bridge_message_status`, `get_anchor_block_state`, `get_nft_holdings`, `search`)
- **Hosting**: Cloudflare Workers (free tier, 100k req/day)
- **Package**: `@taikoxyz/mcp-data`
- **Why first**: Read-only, zero key management, highest developer demand

### 2. [taiko-node-monitor MCP](plans/taiko-node-monitor-mcp.md)
**Node health monitoring MCP for simple-taiko-node** ✅ Built

- **Base**: Built from scratch with **Python FastMCP** + `docker` SDK
- **Service labels**: `l2_execution_engine` (taiko-geth), `taiko_client_driver` (taiko-client driver) — confirmed from docker-compose.yml
- **Tools (7 total)**: `get_node_health`, `get_sync_progress`, `get_peer_count`, `check_l1_connection`, `get_node_logs`, `restart_service`, `get_preconf_node_status`
- **Hosting**: Local stdio only (requires Docker socket + `localhost:8547`)
- **Package**: `taiko-node-monitor` (PyPI, distributed via `uvx`)

---

## Phase 2: Following Month

### 3. [taiko-bridge MCP](plans/taiko-bridge-mcp.md)
**L1↔L2 bridge operations and relay monitoring**

- **Base**: Build from scratch with TypeScript MCP SDK + **viem v2** (no existing bridge MCP to fork)
- **ABIs**: Sourced from `taikoxyz/taiko-mono/packages/protocol/artifacts/`
- **Tools (9 total)**:
  - Read (5): `get_message_status`, `get_pending_messages`, `estimate_bridge_fee`, `list_supported_tokens`, `get_bridge_history`
  - Write (4): `bridge_eth`, `bridge_erc20`, `retry_message`, `recall_message`
- **Hosting**: v1 local stdio; v2 CF Workers for read-only, local stdio for write
- **Security**: `simulateContract` before every write; separate env vars per network key
- **Package**: `@taikoxyz/mcp-bridge`

### 4. [taiko-explorer MCP](plans/taiko-explorer-mcp.md)
**Smart contract analysis MCP**

- **Base**: Fork `crazyrabbitLTC/mcp-etherscan-server` (MIT, TypeScript)
- **Tools (7 total)**: `get_contract_creator`, `verify_source`, `decode_calldata`, `check_taiko_compatibility` *(unique — Shanghai opcode scanner)*, `get_similar_contracts`, `get_contract_metrics`, `analyze_contract`
- **Hosting**: 6 tools on CF Workers (free); `analyze_contract` on Railway/Fly.io (~$5-8/month)
- **Package**: `@taikoxyz/mcp-explorer`

---

## Phase 3: CLI

### 5. [taiko CLI](plans/taiko-cli.md)
**TypeScript CLI for all Taiko-specific operations**

- **Language**: TypeScript (NOT Go/Rust) — shares `@taikoxyz/taiko-api-client` with MCPs
- **Framework**: `commander`
- **Distribution**: `npm install -g @taiko/cli` + optional `bun build --compile` binary
- **Command groups (9)**: `network`, `node`, `prover`, `bridge`, `contract`, `preconf`, `anchor`, `faucet`, `x402`
- **Hard requirement**: Every command supports `--json` from day one (AI agent compatibility)
- **Scope**: Taiko-specific protocols only — does NOT re-implement Foundry's compile/test/deploy/call/send

---

## Repository Structure

```
taikoxyz/taiko-ai/
├── plan.md                            # This file — top-level plan
├── plans/                             # Detailed per-item implementation plans
│   ├── shared-library.md
│   ├── taiko-data-mcp.md
│   ├── taiko-node-monitor-mcp.md
│   ├── taiko-bridge-mcp.md
│   ├── taiko-explorer-mcp.md
│   └── taiko-cli.md
│
├── packages/                          # NEW: Shared TypeScript utilities
│   └── taiko-api-client/              # @taikoxyz/taiko-api-client
│
├── mcp-servers/                       # MCP server implementations
│   ├── taiko-data/                    # @taikoxyz/mcp-data (TypeScript)
│   ├── taiko-bridge/                  # @taikoxyz/mcp-bridge (TypeScript)
│   ├── taiko-explorer/                # @taikoxyz/mcp-explorer (TypeScript)
│   └── taiko-node-monitor/            # taiko-node-monitor (Python)
│
├── cli/                               # @taiko/cli (TypeScript)
│
├── agents/                            # Existing Claude Code agents
├── skills/                            # Existing Claude Code skills
└── package.json                       # npm workspaces: ["mcp-servers/*", "packages/*", "cli"]
```

**Note**: `taiko-node-monitor` is Python with `pyproject.toml` — it sits alongside the TypeScript MCPs but uses separate build/publish tooling.

---

## Deferred / Deprioritized

| Item | Reason |
|------|--------|
| `taiko-wallet` MCP | Superseded by `taiko bridge` write tools + `taiko-cli wallet` commands. Private key management is better as a CLI tool. |
| `taiko-prover` MCP | Highly specialized; defer until prover market matures post-Shasta and usage patterns are clear. |
| `taiko-proposer` MCP | Same as prover — defer post-Shasta. |
| `taiko-preconf` MCP | Phase 2 preconf (permissionless) launching Q1 2026; `taiko-node-monitor` covers monitoring. Reassess after Phase 2 ships. |
| `taiko-defi` MCP | DeFi protocols are generic; lower priority than infrastructure MCPs. Defer until core MCPs are stable. |
| Go/Rust CLI | TypeScript reuse wins for code sharing; Go performance advantage irrelevant for RPC I/O. |

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MCP language | TypeScript (except node-monitor) | Official SDK, best LLM code gen, CF Workers compatible |
| node-monitor language | Python | Superior `docker` SDK; FastMCP zero-boilerplate |
| EVM library | viem v2 | EIP-7702 support, simulateContract, defineChain, active maintenance |
| EVM library (taiko-data fork) | ethers.js v6 (inherited from fork) | Keep fork's existing library; don't introduce viem churn |
| CLI language | TypeScript | Shares `@taikoxyz/taiko-api-client` with MCPs |
| Write tool hosting | Local stdio only | Private key never leaves user machine |
| Read tool hosting | Cloudflare Workers | Free tier, zero ops, stateless HTTP |
| Repo organization | This repo (`taikoxyz/taiko-ai`) | Co-located with agents/skills; `mcp-servers/` already exists |
| Mono-repo migration | When 3+ MCPs live and need different release cadences | Not yet needed |
| Taiko EVM | Shanghai (no Cancun opcodes) | Gwyneth upgrade not yet live; `check_taiko_compatibility` enforces this |

---

## Protocol Constants Reference

### Contract Addresses
| Contract | Mainnet | Hoodi |
|----------|---------|-------|
| TaikoInbox (L1) | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` | TBD |
| TaikoAnchor (L2) | `0x1670000000000000000000000000000000010001` | same |
| Bridge (L2) | `0x1670000000000000000000000000000000000001` | `0x167D000000000000000000000000000000000001` |
| SignalService (L2) | `0x1670000000000000000000000000000000000005` | `0x167D000000000000000000000000000000000005` |
| ERC20Vault (L2) | `0x1670000000000000000000000000000000000002` | `0x167D000000000000000000000000000000000002` |
| GOLDEN_TOUCH_ADDRESS | `0x0000777735367b36bC9B61C50022d9D0700dB4Ec` | same |

### API Endpoints
| Service | Mainnet | Hoodi |
|---------|---------|-------|
| RPC | `https://rpc.mainnet.taiko.xyz` | `https://rpc.hoodi.taiko.xyz` |
| Taikoscan API (V2) | `https://api.etherscan.io/v2/api?chainid=167000` | `chainid=167013` (V1 deprecated) |
| Blockscout v2 | `https://blockscoutapi.mainnet.taiko.xyz/api/v2` | `https://blockscoutapi.hoodi.taiko.xyz/api/v2` |
| Relayer | `https://relayer.mainnet.taiko.xyz` | `https://relayer.hoodi.taiko.xyz` |
| x402 Facilitator | `https://facilitator.taiko.xyz` | — |

### Blocked Opcodes (Shanghai EVM)
TLOAD `0x5C`, TSTORE `0x5D`, MCOPY `0x5E`, BLOBHASH `0x49`, BLOBBASEFEE `0x4A` — not available until Gwyneth upgrade. PUSH0 `0x5F` **is** available (Shanghai added it).
