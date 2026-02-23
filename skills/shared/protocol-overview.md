# Taiko Protocol Overview

**Type-1 based rollup** on Ethereum with validity proofs (ZK + TEE).

## Based Rollup Architecture

Unlike traditional rollups, Taiko has no centralized sequencer:
- L1 validators sequence L2 transactions
- Proposers submit batches to Inbox (L1)
- Provers generate validity proofs (SGX/ZK)
- Anchor transaction syncs L1 state to L2

## Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Inbox | L1 | Manages rollup lifecycle (propose, prove, bonds) |
| Anchor | L2 | First tx in block, syncs L1 data |
| SignalService | Both | Cross-chain signal storage/verification |
| Bridge | Both | Message passing with status tracking |
| Vaults | Both | Token bridging (ERC20/721/1155) |

## Proof System

| Type | Description |
|------|-------------|
| TEE (SGX) | Trusted Execution Environment |
| ZK (RISC0) | Zero-knowledge via RISC0 |
| ZK (SP1) | Zero-knowledge via SP1 |

Proofs can be combined (TEE + ZK) for enhanced security.

## Block Flow

```
1. Proposer → Inbox (L1): Submit L2 block batch + blob refs
2. L2 node executes blocks (first tx = Anchor)
3. Prover → Inbox: Submit validity proof
4. Verifier validates → Block finalized
5. Checkpoint synced to SignalService
```

## Key Address

```
GOLDEN_TOUCH_ADDRESS = 0x0000777735367b36bC9B61C50022d9D0700dB4Ec
```
Only this address executes Anchor transactions.

## References

- [Taiko Docs](https://docs.taiko.xyz)
- [Protocol Source](https://github.com/taikoxyz/taiko-mono/tree/main/packages/protocol)
