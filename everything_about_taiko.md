# Everything About Taiko (Research Notes)

## Scope and Method
This document summarizes a focused research pass completed on **February 28, 2026** across:
- Taiko docs (`docs.taiko.xyz`)
- Taiko GitHub repositories (`taiko-mono`, `taiko-geth`, `taiko-reth`)
- Live network/API checks (RPC + relayer endpoints)

I prioritized primary sources (official docs, official repos, and live endpoints). Where sources conflicted, I called out the conflict explicitly and validated against live chain behavior when possible.

## Executive Snapshot
- Taiko Alethia is positioned as an **Ethereum-equivalent, based rollup**.
- Main production L2: **Taiko Alethia** (`chainId = 167000`).
- Current public test L2: **Taiko Hoodi** (`chainId = 167013`).
- L1 counterpart for Hoodi environment: **Ethereum Hoodi** (`chainId = 560048`).
- Node architecture follows execution/consensus separation:
  - `taiko-geth` (execution)
  - `taiko-client` (consensus/driver/proposer/prover)
- Bridge model is trust-minimized and proof-based, centered around:
  - `TaikoInbox` on L1
  - `TaikoAnchor` on L2
  - Signal service and merkle proof verification

## Taiko Protocol Positioning
From official docs:
- Taiko emphasizes **based rollup sequencing** (L1 validator ordering, no external centralized sequencer).
- The protocol presents itself as **Ethereum-equivalent** (tooling and contract compatibility focus).
- It uses a **multiproof architecture** (TEE + ZK combinations).
- It is actively evolving with named upgrades/forks (Pacaya, Shasta, and upcoming work referenced in release notes/changelogs).

## Core Network Facts
### Official public RPCs
- Mainnet: `https://rpc.mainnet.taiko.xyz`
- Hoodi: `https://rpc.hoodi.taiko.xyz`

### Official explorers
- Mainnet Taikoscan: `https://taikoscan.io`
- Hoodi Taikoscan: `https://hoodi.taikoscan.io`
- Mainnet Blockscout: `https://blockscout.mainnet.taiko.xyz`
- Hoodi Blockscout: `https://blockscout.hoodi.taiko.xyz`

### Chain IDs
- Taiko mainnet L2: `167000`
- Taiko Hoodi L2: `167013`
- Ethereum Hoodi L1: `560048`

## Contract Address Model (Important)
### Mainnet L2 canonical predeploy pattern
Mainnet docs/deployment logs align with:
- Bridge: `0x1670000000000000000000000000000000000001`
- ERC20Vault: `0x1670000000000000000000000000000000000002`
- SignalService: `0x1670000000000000000000000000000000000005`
- TaikoAnchor: `0x1670000000000000000000000000000000010001`

### Hoodi L2 canonical predeploy pattern
From Taiko deployment logs and live RPC checks, Hoodi is:
- Bridge: `0x1670130000000000000000000000000000000001`
- ERC20Vault: `0x1670130000000000000000000000000000000002`
- SignalService: `0x1670130000000000000000000000000000000005`
- TaikoAnchor: `0x1670130000000000000000000000000000010001`

### Live RPC validation performed
Against `https://rpc.hoodi.taiko.xyz`:
- `eth_getCode(0x167D...)` => `0x` (not deployed)
- `eth_getCode(0x167013...)` => bytecode present

Conclusion: for Hoodi, using `0x167D...` addresses is incorrect.

## Node Architecture and Operation
### Main components
- `taiko-geth`: minimally modified Geth-based execution layer.
- `taiko-client`: consensus/driver + proposer + prover roles.

### Synchronization model (docs)
- Driver starts from verified L2 head from L1 inbox state.
- Uses P2P sync and/or sequential insertion via Engine API.
- Ingests `BatchProposed` and anchors/executes blocks.

### Practical ops notes from docs
- Shared JWT secret between execution and client components is mandatory.
- P2P configuration quality (publicly reachable IP/ports) is critical, especially for preconfirmation participation.
- For preconf connectivity guidance in docs:
  - Mainnet healthy peers target shown as `>= 6`
  - Hoodi healthy peers target shown as `>= 3`

## Based Preconfirmations (State as Documented)
Docs describe a staged rollout model:
- Whitelisted phase (partner-operated preconf sidecars)
- Secured-by-stake phase (validator opt-in/delegation)

Key functional points:
- Transactions can receive execution preconfirmation before final L1 proposal.
- Preconfers sequence/gossip off-chain and later propose on-chain batches.
- Slashing mechanisms are referenced for commitment failures.

Operational implication for developer tooling:
- Health tooling should expose both L1-anchored and preconf/P2P state, not just generic JSON-RPC sync flags.

## Bridge Model
Taiko bridge design is described as trust-minimized and proof-based:
- Source chain lock/burn + signal emission
- Destination chain proof verification + mint/release

Important integration detail:
- ETH bridging path is via bridge `sendMessage`.
- Token bridging path is via token vault contracts on source and destination sides.
- Direction-specific contract usage matters; L1 and L2 vaults are not interchangeable.

## Repository Landscape
### `taiko-mono`
- Monorepo for protocol contracts, client, relayer, docs site, and ecosystem services.
- Branch availability confirmed:
  - `main`
  - `taiko-alethia-protocol-v3.0.0`
  - `taiko-alethia-protocol-v3.1.0`

### `taiko-geth`
- Taiko-maintained EL fork (README states base on upstream Geth versions).
- Branch `taiko` is primary Taiko branch.
- Recent tags observed include `v2.3.0` (2026-02 timeframe).

### `taiko-reth`
- Taiko-specific repo exists with `main` and `taiko` branches.
- Tag surface looked sparse at time of this pass (no recent tags returned in quick check).

## Release Cadence Signals (Observed)
From fetched release snapshots/changelogs:
- `taiko-mono` has frequent component releases (docs, client, event indexer, etc.).
- `taiko-geth` shows active 2.x release line in 2026.
- `simple-taiko-node` and `raiko` continue active updates.

Implication:
- Tooling should avoid hardcoding protocol assumptions without version gates.
- Address/constants packages should include fast update paths and explicit provenance.

## Security and Reliability Notes for Builders
When building AI MCPs/CLIs on Taiko:
- Treat network constants as high-risk configuration and validate with:
  - official deployment logs
  - live `eth_getCode` checks
- Separate read-only and write/signing surfaces.
- Prefer simulation before write calls (`eth_call`/client simulate APIs).
- Make relayer dependencies fault-tolerant (timeouts, endpoint drift, schema drift).
- Avoid static “known token” lists unless continuously synced from canonical source.

## EVM Compatibility (Shanghai)
Taiko mainnet runs **Shanghai EVM** (no Cancun/Prague).

### Blocked opcodes on Taiko (pre-Cancun)
| Opcode | Hex  | Introduced In |
|--------|------|---------------|
| TLOAD  | 0x5C | Cancun        |
| TSTORE | 0x5D | Cancun        |
| MCOPY  | 0x5E | Cancun        |
| BLOBHASH | 0x49 | Cancun      |
| BLOBBASEFEE | 0x4A | Cancun   |

**Note:** `PUSH0` (0x5F) IS available — it was introduced in Shanghai.

### Upgrade status (as of February 2026)
- **Shasta**: Live on Hoodi testnet. NOT yet on mainnet.
- **Gwyneth/Pectra**: Not yet deployed. Will bring Cancun + EIP-7702.

## Bridge Protocol Details

### Message status enum
| Value | Status    | Description |
|-------|-----------|-------------|
| 0     | NEW       | Message sent, not yet relayed |
| 1     | RETRIABLE | Relay attempted, can retry |
| 2     | DONE      | Successfully relayed |
| 3     | FAILED    | Relay failed permanently |
| 4     | RECALLED  | Refunded to srcOwner |

### IBridge.Message struct field types
Critical for avoiding precision loss:
- `uint64 id` — message identifier
- `uint64 fee` — processing fee (exceeds JS Number.MAX_SAFE_INTEGER range)
- `uint32 gasLimit` — gas limit for destination execution
- `uint64 srcChainId` / `uint64 destChainId` — chain identifiers
- `address from`, `address srcOwner`, `address destOwner`, `address to`
- `uint256 value` — ETH value
- `bytes data` — calldata

**Important:** `fee` and chain ID fields are `uint64` (max 2^64-1). JavaScript `Number` is only safe to 2^53. Use `BigInt` for these fields.

## Research Gaps / Limitations
- `taiko.xyz` content was blocked by a Vercel security checkpoint from this environment.
- Mirror blog endpoints were blocked by Cloudflare challenge pages.
- Result: I relied on docs + repositories + live endpoints for authoritative research.

## Sources
- Taiko docs home: https://docs.taiko.xyz
- RPC configuration: https://docs.taiko.xyz/network-reference/rpc-configuration
- Network configuration: https://docs.taiko.xyz/network-reference/network-configuration
- Software releases reference: https://docs.taiko.xyz/network-reference/software-releases-and-deployments
- Contract addresses reference: https://docs.taiko.xyz/network-reference/contract-addresses
- What is Taiko Alethia: https://docs.taiko.xyz/taiko-alethia-protocol/what-is-taiko-alethia
- Based rollups: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-design/based-rollups
- Based preconfirmations: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-design/based-preconfirmation
- Node architecture: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-architecture/taiko-alethia-nodes
- Bridging architecture: https://docs.taiko.xyz/taiko-alethia-protocol/protocol-architecture/bridging
- Node operator guides:
  - https://docs.taiko.xyz/guides/node-operators/run-a-node-for-taiko-alethia
  - https://docs.taiko.xyz/guides/node-operators/run-a-node-for-taiko-hoodi
  - https://docs.taiko.xyz/guides/node-operators/enable-a-prover
- taiko-mono repo: https://github.com/taikoxyz/taiko-mono
- taiko-mono `v3.0.0` branch: https://github.com/taikoxyz/taiko-mono/tree/taiko-alethia-protocol-v3.0.0
- Hoodi deployment logs: https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md
- Mainnet L1 logs: https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L1.md
- Mainnet L2 logs: https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L2.md
- taiko-geth repo: https://github.com/taikoxyz/taiko-geth
- taiko-reth repo: https://github.com/taikoxyz/taiko-reth
