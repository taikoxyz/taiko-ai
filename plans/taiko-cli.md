# taiko CLI — Implementation Plan

## Status
[x] Built — `cli/` directory, 4 command groups, 24/24 tests pass

## Summary

`@taiko/cli` is a TypeScript command-line tool providing Taiko-specific operations that Foundry (`cast`/`forge`) cannot handle: network profile management, Docker node lifecycle, prover market interactions, bridge operations, contract verification, preconfirmation queries, anchor monitoring, and x402 payment layer. It is distributed via `npm install -g @taiko/cli` (and optionally as a self-contained binary via `bun build --compile`).

**Language**: TypeScript (NOT Go/Rust) — shares `@taikoxyz/taiko-api-client` with the MCP servers, eliminating duplicate Taikoscan/Blockscout/Relayer HTTP clients. RPC calls are network I/O bound; Go's performance advantage does not apply.

**Key design principle**: The CLI wraps Taiko-specific protocols only. It does NOT re-implement Foundry's `compile`, `test`, `deploy`, `call`, `send`, or `balance` commands. All commands support `--json` from day one for AI agent compatibility.

This is Phase 3 — built after the Phase 1/2 MCPs.

---

## Prerequisites

- `packages/taiko-api-client/` built (see `plans/shared-library.md`)
- Docker installed (for `taiko node` commands)
- Foundry installed (referenced for `taiko contract verify` wrapper)
- npm workspace with `"cli"` in workspaces

---

## Target File Structure

```
cli/
├── package.json                     # @taiko/cli, bin: "taiko"
├── tsconfig.json
├── src/
│   ├── index.ts                     # CLI entry point (commander setup)
│   ├── commands/
│   │   ├── network.ts               # taiko network [switch|info|status]
│   │   ├── node.ts                  # taiko node [start|stop|restart|status|logs|upgrade|reset]
│   │   ├── prover.ts                # taiko prover [status|jobs|earnings|bond]
│   │   ├── bridge.ts                # taiko bridge [deposit|withdraw|status|claim|signal]
│   │   ├── contract.ts              # taiko contract [verify]
│   │   ├── preconf.ts               # taiko preconf [status|latency|list|node]
│   │   ├── anchor.ts                # taiko anchor [status|history]
│   │   ├── faucet.ts                # taiko faucet
│   │   └── x402.ts                  # taiko x402 [facilitator|resource|sessions|earnings]
│   ├── lib/
│   │   ├── output.ts                # --json vs human-readable output formatter
│   │   ├── config.ts                # ~/.taiko/config.yaml reader/writer
│   │   ├── docker.ts                # Docker Compose operations (child_process)
│   │   └── errors.ts                # Structured error types with recovery suggestions
│   └── types.ts                     # Shared types
└── tests/
    ├── network.test.ts
    └── output.test.ts
```

**Config file**: `~/.taiko/config.yaml`
```yaml
active_network: mainnet
networks:
  mainnet:
    rpc_url: https://rpc.mainnet.taiko.xyz
    private_key: "" # empty; user sets via env TAIKO_PRIVATE_KEY
  hoodi:
    rpc_url: https://rpc.hoodi.taiko.xyz
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKO_PRIVATE_KEY` | For write ops | — | Signing key for bridge/prover bond |
| `TAIKO_NETWORK` | No | from config | Override active network (`mainnet`/`hoodi`) |
| `TAIKO_RPC_URL` | No | from config | Override RPC endpoint |

---

## Command Surface

```
taiko
├── network
│   ├── switch [mainnet|hoodi]       # Set active network profile in ~/.taiko/config.yaml
│   ├── status                       # Health check: RPC ping, block number, explorer reachability
│   └── info                         # Show active profile: chain ID, block number, gas price, contracts
│
├── node
│   ├── start [--prover] [--proposer] # docker compose up with correct profile
│   ├── stop                           # docker compose down (graceful)
│   ├── restart                        # stop + start
│   ├── status                         # sync %, block height, peer count, chain head
│   ├── logs [--follow] [--service]    # tail logs from taiko-geth / taiko-client
│   ├── upgrade                        # docker compose pull + restart
│   └── reset                          # docker compose down -v (with confirmation prompt)
│
├── prover
│   ├── status                         # Bond amount, pending jobs, queue depth
│   ├── jobs [--status pending|proving|proved|failed]  # Assigned blocks via Event Indexer
│   ├── earnings                       # Rewards earned from proven blocks
│   ├── bond
│   │   ├── info                       # Current bond vs. minimum (125 TAIKO mainnet, 0 Hoodi)
│   │   ├── deposit <amount>           # Approve + deposit TAIKO to TaikoInbox
│   │   └── withdraw <amount>          # Withdraw unbonded TAIKO
│   └── raiko
│       └── status                     # Raiko sidecar health + SGX attestation status
│
├── bridge
│   ├── deposit <amount> [--token <addr>] [--to <addr>]   # L1→L2
│   ├── withdraw <amount> [--token <addr>] [--to <addr>]  # L2→L1 initiate
│   ├── status <tx-hash>               # pending | relayed | claimed + ETA
│   ├── claim <msg-hash>               # Manually trigger proof submission + claim
│   └── signal
│       ├── send <data>                # Send signal via Signal Service
│       └── verify <data> [--src-chain] [--dst-chain]
│
├── contract
│   └── verify <address> [--file <src>] [--network mainnet|hoodi]
│       # Wraps forge verify-contract with Taiko Blockscout endpoint pre-configured
│
├── preconf
│   ├── status <tx-hash>               # Is tx preconfirmed? By whom? Latency?
│   ├── latency                        # Current p50/p95/p99 preconf latency
│   ├── list                           # Active preconfers on whitelist
│   └── node status                    # Local Catalyst sidecar health
│
├── anchor
│   ├── status                         # Latest anchored L1 block, sync lag
│   └── history [--n 10]              # Last N anchor txs
│
├── faucet [--address <addr>]          # Request Hoodi ETH (testnet only)
│
└── x402
    ├── facilitator status             # Check Taiko facilitator health
    ├── resource
    │   ├── create                     # Register API endpoint as x402-protected
    │   └── list                       # Show registered resources
    ├── sessions                       # Active payment sessions
    └── earnings                       # Revenue from x402 payments

Global flags: --json, --network [mainnet|hoodi], --rpc-url, --no-interactive
```

---

## Implementation Steps

### Step 1: Initialize CLI package

```bash
mkdir -p cli/src/{commands,lib}
cd cli
npm init -y
npm install commander @taikoxyz/taiko-api-client viem zod js-yaml
npm install -D typescript tsx vitest @types/node
```

`package.json`:
```json
{
  "name": "@taiko/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "taiko": "./dist/index.js" },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "test": "vitest"
  }
}
```

### Step 2: Output formatting (critical — AI agent compatibility)

Every command must support `--json` flag. Create a shared output module:

```typescript
// src/lib/output.ts
export type OutputMode = "human" | "json";

export interface CommandResult<T = unknown> {
  schema_version: "1.0";
  command: string;
  status: "success" | "error" | "warning";
  network: "mainnet" | "hoodi";
  data: T;
  errors: string[];
  warnings: string[];
  metrics: { latency_ms: number };
}

export function output<T>(result: CommandResult<T>, mode: OutputMode): void {
  if (mode === "json") {
    console.log(JSON.stringify(result, null, 2));
  } else {
    // Human-readable formatting per command type
    renderHuman(result);
  }
}
```

**This is a hard requirement — every command must support `--json` from day one.**

### Step 3: Config management

```typescript
// src/lib/config.ts
import * as yaml from "js-yaml";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_PATH = path.join(os.homedir(), ".taiko", "config.yaml");

export function readConfig(): TaikoConfig {
  if (!fs.existsSync(CONFIG_PATH)) return DEFAULT_CONFIG;
  return yaml.load(fs.readFileSync(CONFIG_PATH, "utf8")) as TaikoConfig;
}

export function writeConfig(config: TaikoConfig): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, yaml.dump(config));
}
```

### Step 4: `taiko network` commands

```typescript
// src/commands/network.ts
import { Command } from "commander";
import { NETWORKS } from "@taikoxyz/taiko-api-client";

export function networkCommand(program: Command) {
  const network = program.command("network");

  network.command("switch <network>")
    .description("Set active network profile")
    .action(async (networkName: "mainnet" | "hoodi", opts) => {
      const config = readConfig();
      config.active_network = networkName;
      writeConfig(config);
      output({ status: "success", data: { active_network: networkName }, ... }, opts.json ? "json" : "human");
    });

  network.command("status")
    .description("Health check: RPC, explorer, bridge reachability")
    .action(async (opts) => {
      const net = NETWORKS[getActiveNetwork()];
      const [rpcOk, explorerOk] = await Promise.all([
        pingRPC(net.rpc),
        pingURL(net.taikoscanExplorer),
      ]);
      output({ status: "success", data: { rpc: rpcOk, explorer: explorerOk, ... }, ... }, ...);
    });
}
```

### Step 5: `taiko node` commands

```typescript
// src/commands/node.ts
import { execSync, spawn } from "child_process";

// All node commands shell out to docker compose in COMPOSE_DIR
function dockerCompose(args: string[], composeDir: string): string {
  return execSync(`docker compose ${args.join(" ")}`, {
    cwd: composeDir,
    env: { ...process.env },
    encoding: "utf8",
  });
}
```

**`taiko node status`** implementation:
- `eth_syncing` → sync status
- `net_peerCount` → peer count
- `eth_blockNumber` → current L2 block
- `taiko_headL1Origin` → L1 anchor lag

### Step 6: `taiko prover` commands

These call Taiko's Event Indexer API and TaikoInbox contract directly:
- `prover status`: Check liveness bond via TaikoInbox contract read
- `prover jobs`: Query Event Indexer API (endpoint TBD — inspect prover tooling in `taiko-mono`)
- `prover bond deposit`: Requires signing — approve TAIKO ERC-20 + deposit to TaikoInbox
- `prover bond withdraw`: Sign + call TaikoInbox withdraw function

### Step 7: `taiko bridge` commands

Wraps IBridge contract interactions and Taiko Relayer API. Share implementations with `@taikoxyz/mcp-bridge` where possible via `@taikoxyz/taiko-api-client`.

**`taiko bridge deposit`**: Call IBridge.sendMessage with ETH value or IERC20Vault.bridgeToken for ERC-20.

**`taiko contract verify`**: Wrapper around `forge verify-contract`:
```bash
forge verify-contract {address} {contract} \
  --verifier blockscout \
  --verifier-url {NETWORKS[net].blockscout}/api \
  --compiler-version {version from build artifacts} \
  --num-of-optimizations {from build artifacts}
```
This resolves the friction of manually specifying all forge verify flags for Taiko's Blockscout instances.

### Step 8: Release strategy

| Phase | Scope | Goal |
|-------|-------|------|
| v0.1 | `network`, `node start/stop/status/logs`, `--json` everywhere | Before next major upgrade |
| v0.2 | `bridge deposit/withdraw/status`, `contract verify`, `prover status/bond` | Alongside or after Phase 2 MCPs |
| v0.3 | `preconf`, `prover jobs/earnings`, `anchor`, `faucet`, `x402` | Post-Shasta stabilization |
| v1.0 | Binary distribution via `bun build --compile`, programmatic API | 2026 |

### Step 9: Distribution

```bash
# Primary: npm global install
npm install -g @taiko/cli

# Zero-install (npx)
npx @taiko/cli network status

# Self-contained binary (via bun)
bun build --compile --target bun src/index.ts --outfile taiko
# Upload to GitHub Releases as binary artifact
```

---

## Hosting

CLI binary — runs locally on developer machines. No server hosting.

Distribution: npm registry (`@taiko/cli`), GitHub Releases binary downloads.

---

## Verification

```bash
# Install from local workspace
cd cli && npm run build && npm link

# Network check
taiko network status --json
# Expected: { "status": "success", "data": { "rpc": true, "explorer": true, "block_number": N } }

taiko network switch hoodi
taiko network info --json
# Expected: { "data": { "chain_id": 167013, "active_network": "hoodi", ... } }

# Node status (requires simple-taiko-node running)
taiko node status --json
# Expected: { "data": { "synced": true, "peer_count": N, "block_number": M, ... } }

# Bridge status
taiko bridge status <known-tx-hash> --network hoodi --json
# Expected: { "data": { "status": "DONE", "msg_hash": "0x..." } }

# Contract verify (requires forge installed)
taiko contract verify 0x1670... --network mainnet --json
# Expected: { "data": { "verified": true, "taikoscan_url": "https://taikoscan.io/..." } }
```

---

## Research Notes

<!-- Merged from research_cli.md — reference only -->

### Language Decision
**TypeScript over Go** (overrides research_cli.md recommendation):

| Factor | Go | TypeScript (Node.js) |
|--------|----|--------------------|
| Perf bottleneck | Network I/O (RPC) — Go wins nothing | Same |
| Code sharing with MCPs | None | Shared `@taikoxyz/taiko-api-client` |
| EIP-7702 / viem support | Need Go equiv | Already in viem |
| CLI framework | cobra | `commander` or `oclif` |
| Distribution | Binary | `npm install -g` + optional `bun --compile` |

### CLI vs MCP Distinction
- **MCP tool calls** in Claude Desktop/Code: native protocol, zero subprocess overhead
- **CLI via Bash tool**: works in ALL AI frameworks (LangChain, AutoGPT, CrewAI), ~40% more token efficient than prose
- **Human in terminal**: standard UX, tab completion, `--help`
These serve different audiences — build both.

### zkSync CLI (Best-in-Class Reference)
```bash
npx zksync-cli dev [start|stop|clean|logs|restart|wallets]
npx zksync-cli wallet [transfer|bridge|deposit|withdraw]
npx zksync-cli contract [read|write|encode|decode]
```
zkSync is the closest analogue to what Taiko should build.

### The Golden Rule: Don't Compete with Foundry
Foundry already handles: compile, test, fuzz, deploy, call, send, balance, block info, tx details, ABI encode/decode, gas estimation, wallet/key management, local dev node.

Taiko CLI handles ONLY: operations impossible or painful in Foundry because they require Taiko-specific contracts, protocols, or infrastructure.

### AI Agent Requirements for CLI
| Requirement | Why |
|-------------|-----|
| `--json` flag | Agents parse structured output; prose is expensive and unreliable |
| Noun→verb hierarchy | `taiko node status` — agent-discoverable via `--help` |
| Idempotent operations | Agents retry on failure |
| Exit codes: 0=success, 1-2=correctable, 3-125=app-specific | Reliable error handling |
| Parseable errors: `"prover_not_ready"` not `"Error: operation failed"` | Machine-readable |
| `--no-interactive` flag | Agents can't handle prompts |

### Prover Market (Taiko's Unique CLI Category)
After Shasta mandates 100% ZK coverage, every proposer needs a prover. Key pain points:
- Approving TaikoInbox as ERC-20 spender with exact bond amounts (125 TAIKO liveness bond)
- Monitoring `permissionlessProvingDelay` windows (72h) to know when open proving starts
- Querying Taiko's Event Indexer API for assigned blocks
- Interacting with Raiko sidecar for SGX/ZK proof generation

No other L2 CLI offers prover management — this is Taiko's differentiator.

### What to Defer to v2+
| Feature | Reason |
|---------|--------|
| Shadow protocol | EIP-7503 still in development |
| Multi-hop bridge proofs | Affects <5% of developers |
| Guardian contestation | Only relevant to Guardian Council |
| Preconfer staking | Permissionless phase not live yet |
| Local Taiko dev stack (Taiko-aware anvil) | High value, high complexity |

### Name Collision Warning
Taiko browser automation library (`taiko`) exists on npm. Use `@taiko/cli` as npm package name. Install as `taiko` binary command. Avoid publishing bare `taiko` to avoid conflict.

### Sources
- zkSync CLI: https://v2-docs.zksync.io/api/tools/zksync-cli/
- Foundry Book: https://book.getfoundry.sh/cast
- Taiko Bridge Signal Service: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-architecture/bridging
- Taiko Preconf docs: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-design/based-preconfirmation/
- simple-taiko-node: https://github.com/taikoxyz/simple-taiko-node
- Taiko contract verification: https://docs.taiko.xyz/guides/app-developers/verify-a-contract/
- x402 protocol: https://www.x402.org/
