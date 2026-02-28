# Everything About Taiko

Concise reference for this repository.
Last updated: February 28, 2026.

## What Taiko Is
- Taiko is an Ethereum-equivalent based rollup.
- This repo targets:
  - Taiko Mainnet L2 (`chainId: 167000`)
  - Taiko Hoodi L2 (`chainId: 167013`)
  - Ethereum L1 (Mainnet `1`, Hoodi `560048`)

## Network Quick Reference

| Network | Chain ID | Default RPC | Relayer | Explorer |
|---|---:|---|---|---|
| Taiko Mainnet (L2) | 167000 | `https://rpc.mainnet.taiko.xyz` | `https://relayer.mainnet.taiko.xyz` | `https://taikoscan.io` |
| Taiko Hoodi (L2) | 167013 | `https://rpc.hoodi.taiko.xyz` | `https://relayer.hoodi.taiko.xyz` | `https://hoodi.taikoscan.io` |
| Ethereum Mainnet (L1) | 1 | `https://eth.drpc.org` (default in bridge MCP) | N/A | Etherscan |
| Ethereum Hoodi (L1) | 560048 | `https://hoodi.drpc.org` (default in bridge MCP) | N/A | Hoodi explorer |

Code source:
- `packages/taiko-api-client/src/networks.ts`
- `mcp-servers/taiko-bridge/src/networks.ts`

## Canonical Contract Addresses Used Here

### L2 predeploy-style contracts

| Contract | Mainnet L2 | Hoodi L2 |
|---|---|---|
| Bridge | `0x1670000000000000000000000000000000000001` | `0x1670130000000000000000000000000000000001` |
| ERC20Vault | `0x1670000000000000000000000000000000000002` | `0x1670130000000000000000000000000000000002` |
| SignalService | `0x1670000000000000000000000000000000000005` | `0x1670130000000000000000000000000000000005` |
| TaikoAnchor | `0x1670000000000000000000000000000000010001` | `0x1670130000000000000000000000000000010001` |

### L1 bridge contracts used by bridge MCP

| Contract | Mainnet L1 | Hoodi L1 |
|---|---|---|
| Bridge | `0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC` | `0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80` |
| ERC20Vault | `0x996282cA11E5DEb6B5D122CC3B9A1FcAAD4415Ab` | `0x0857cd029937E7a119e492434c71CB9a9Bb59aB0` |

## Bridge Semantics
- ETH path: `IBridge.sendMessage`.
- ERC20 path: `IERC20Vault.bridgeToken`.
- Direction matters:
  - `L1_TO_L2` uses L1 contracts as source.
  - `L2_TO_L1` uses L2 contracts as source.

### Message Status Enum

| Code | Status |
|---:|---|
| 0 | `NEW` |
| 1 | `RETRIABLE` |
| 2 | `DONE` |
| 3 | `FAILED` |
| 4 | `RECALLED` |

Shared mapping source: `packages/taiko-api-client/src/relayer.ts`.

### Numeric Safety
- Bridge message fields include `uint64` values (`fee`, `id`, `srcChainId`, `destChainId`).
- Never treat these as JS `number` for business logic.
- Use `BigInt` end-to-end.

## Node Architecture (Operational View)
- Execution: `taiko-geth`.
- Driver/consensus roles: `taiko-client`.
- Local docker setup is expected at `~/simple-taiko-node` unless `COMPOSE_DIR` is set.

### Peer Health Defaults (in this repo)
- Mainnet target: `>= 6` peers.
- Hoodi target: `>= 3` peers.
- Override env:
  - `TAIKO_MIN_PEERS_MAINNET`
  - `TAIKO_MIN_PEERS_TESTNET`

Source: `mcp-servers/taiko-node-monitor/taiko_node_monitor/server.py`.

## EVM Compatibility Notes
- Current compatibility checks in this repo assume Taiko Shanghai mode by default.
- Explicitly blocked opcodes in Shanghai mode:
  - `TLOAD (0x5c)`
  - `TSTORE (0x5d)`
  - `MCOPY (0x5e)`
  - `BLOBHASH (0x49)`
  - `BLOBBASEFEE (0x4a)`
- `PUSH0 (0x5f)` is allowed.
- Compatibility tooling supports version toggle via `TAIKO_EVM_VERSION=shanghai|cancun|pectra`.

Source: `mcp-servers/taiko-explorer/src/lib/opcodes.ts`.

## CLI/MCP Design Constraints in This Repo
- CLI `bridge deposit` is intentionally a non-implemented placeholder; use MCP write tools for real bridging.
- CLI and MCP status/pagination mapping is centralized in `@taikoxyz/taiko-api-client` to avoid drift.
- Node logs JSON mode is non-streaming (`--follow` + `--json` is rejected by design).

## Practical Checklist for Contributors
1. Validate network constants in one place first (`taiko-api-client/src/networks.ts`).
2. Reuse shared relayer status helpers; avoid local status enum copies.
3. For bridge writes, simulate before sending and keep fees as `BigInt`.
4. Keep JSON output contracts deterministic for CLI/MCP consumers.
5. Prefer deleting stale audit/plan artifacts after implementation lands.

## Canonical External References
- Docs: https://docs.taiko.xyz
- Taiko monorepo: https://github.com/taikoxyz/taiko-mono
- Mainnet explorer: https://taikoscan.io
- Hoodi explorer: https://hoodi.taikoscan.io
- Mainnet bridge UI: https://bridge.taiko.xyz
- Hoodi bridge UI: https://bridge.hoodi.taiko.xyz

## In-Repo Primary Files
- `packages/taiko-api-client/src/networks.ts`
- `packages/taiko-api-client/src/relayer.ts`
- `mcp-servers/taiko-bridge/src/networks.ts`
- `mcp-servers/taiko-bridge/src/tools/read-tools.ts`
- `mcp-servers/taiko-bridge/src/tools/write-tools.ts`
- `mcp-servers/taiko-node-monitor/taiko_node_monitor/server.py`
- `mcp-servers/taiko-explorer/src/lib/opcodes.ts`
- `cli/src/commands/bridge.ts`
- `cli/src/commands/contract.ts`
- `cli/src/commands/node.ts`
