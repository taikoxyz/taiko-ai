# Taiko Protocol Overview

Taiko is a **Type-1 based rollup** on Ethereum that achieves finality through validity proofs (ZK and TEE). The protocol is designed to be fully Ethereum-equivalent.

## Based Rollup Architecture

Unlike traditional rollups with centralized sequencers, Taiko uses a "based" architecture:

1. **L1 validators sequence L2 transactions** - No centralized sequencer
2. **Proposers** submit batches of L2 blocks to the `Inbox` contract on L1
3. **Provers** generate validity proofs (SGX/ZK) to finalize blocks
4. **The Anchor transaction** on L2 synchronizes L1 state to L2

## Core Components

### Inbox Contract (L1)

The Inbox is the central L1 contract managing the rollup lifecycle:

| Function | Purpose |
|----------|---------|
| `propose()` | Submit new L2 block proposals |
| `prove()` | Submit validity proofs |
| `deposit()` | Stake bond tokens |
| `withdraw()` | Withdraw bond tokens |

**Key Configuration:**
```solidity
struct Config {
    address proofVerifier;      // Verifies ZK/TEE proofs
    address signalService;      // For checkpoint syncing
    address bondToken;          // TAIKO token for bonds
    uint64 minBond;             // Minimum bond required
    uint32 provingWindow;       // Time window for proving
}
```

### Anchor Contract (L2)

The Anchor is the **first transaction in every L2 block**, executed by `GOLDEN_TOUCH_ADDRESS`.

- Validates chain integrity via ancestors hash
- Stores L1 checkpoint data in SignalService
- Records parent block hash for app access

### SignalService

The fundamental primitive for cross-chain communication:

- **Sending**: Store a signal (bytes32) at a deterministic slot
- **Verifying**: Prove signal existence via merkle proof against synced state root

### Bridge

Higher-level message passing with:
- Status tracking (NEW, RETRIABLE, DONE, FAILED, RECALLED)
- Automatic retries for failed messages
- Recall mechanism for stuck funds
- Fee distribution to relayers

### Vaults (ERC20/ERC721/ERC1155)

Token bridging with:
- Automatic bridged token deployment
- Lock/unlock for canonical tokens
- Mint/burn for bridged tokens

## Proof System

Taiko supports multiple proof types:

| Proof Type | Description |
|------------|-------------|
| TEE (SGX) | Trusted Execution Environment proofs |
| ZK (RISC0) | Zero-knowledge proofs via RISC0 |
| ZK (SP1) | Zero-knowledge proofs via SP1 |

Proofs can be combined (e.g., TEE + ZK) for enhanced security.

## Block Finalization Flow

```
1. Proposer submits L2 block batch to Inbox (L1)
   └── Includes blob data references

2. L2 node executes blocks
   └── First tx is always Anchor (syncs L1 data)

3. Prover generates validity proof
   └── SGX attestation or ZK proof

4. Proof submitted to Inbox
   └── Verifier validates proof

5. Block finalized
   └── Checkpoint synced to SignalService
```

## Protocol Parameters

| Parameter | Description |
|-----------|-------------|
| Proving Window | Time allowed for proof submission |
| Permissionless Proving Delay | Delay before anyone can prove |
| Withdrawal Delay | Delay before bond withdrawal |
| Forced Inclusion Delay | Delay for forced L2 inclusion |
| Basefee Sharing | Percentage of L2 basefee shared |

## Key Addresses

### Golden Touch Address

```
0x0000777735367b36bC9B61C50022d9D0700dB4Ec
```

This special address executes Anchor transactions. Only this address can call `anchorV4()`.

## References

- [Taiko Documentation](https://docs.taiko.xyz)
- [Protocol Source Code](https://github.com/taikoxyz/taiko-mono/tree/main/packages/protocol)
