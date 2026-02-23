# Anchor Contract

The Anchor contract is executed as the **first transaction in every L2 block**. It synchronizes L1 data to L2 and provides useful functions for application developers.

## Overview

```solidity
contract Anchor is EssentialContract {
    // Only this address can execute anchor transactions
    address public constant GOLDEN_TOUCH_ADDRESS = 0x0000777735367b36bC9B61C50022d9D0700dB4Ec;

    // Gas limit for anchor transactions
    uint64 public constant ANCHOR_GAS_LIMIT = 1_000_000;

    // Checkpoint store (SignalService on L2)
    ICheckpointStore public immutable checkpointStore;

    // The L1's chain ID
    uint64 public immutable l1ChainId;

    // Mapping from L2 block number to block hash
    mapping(uint256 blockNumber => bytes32 blockHash) public blockHashes;
}
```

## Public Functions for App Developers

### 1. Block Hashes

Access historical L2 block hashes (up to 256 recent blocks):

```solidity
// Get parent block hash
bytes32 parentHash = Anchor(anchorAddress).blockHashes(block.number - 1);

// Get older block hash (within 256 blocks)
bytes32 olderHash = Anchor(anchorAddress).blockHashes(block.number - 100);
```

**Use Cases:**
- Randomness source (with caution - can be manipulated)
- Historical data verification
- Cross-contract commitments

### 2. Block State

Get current anchor state:

```solidity
struct BlockState {
    uint48 anchorBlockNumber;  // Latest L1 block number anchored
    bytes32 ancestorsHash;     // Rolling hash of ancestor blocks
}

Anchor.BlockState memory state = anchor.getBlockState();
```

**Use Cases:**
- Determine which L1 block the current L2 state is anchored to
- Verify chain integrity via ancestors hash

### 3. L1 Chain ID

```solidity
uint64 l1ChainId = anchor.l1ChainId();
```

**Use Cases:**
- Verify you're on the expected L2 (paired with correct L1)
- Cross-chain message validation

### 4. Checkpoint Store Access

Access L1 checkpoints via the SignalService:

```solidity
ICheckpointStore checkpointStore = anchor.checkpointStore();

// Get L1 checkpoint
ICheckpointStore.Checkpoint memory checkpoint =
    checkpointStore.getCheckpoint(l1BlockNumber);

// Checkpoint contains:
// - blockNumber: L1 block number
// - blockHash: L1 block hash
// - stateRoot: L1 state root (for merkle proofs)
```

**Use Cases:**
- Verify L1 state in L2 contracts
- Build cross-chain proofs
- Access L1 block data

## Accessing L1 Data from L2

Complete example:

```solidity
contract L1DataReader {
    Anchor public anchor;

    constructor(address _anchor) {
        anchor = Anchor(_anchor);
    }

    function getL1BlockInfo() external view returns (
        uint48 l1BlockNumber,
        bytes32 l1BlockHash,
        bytes32 l1StateRoot
    ) {
        // Get current anchor state
        Anchor.BlockState memory state = anchor.getBlockState();
        l1BlockNumber = state.anchorBlockNumber;

        // Get L1 checkpoint data
        ICheckpointStore checkpointStore = anchor.checkpointStore();
        ICheckpointStore.Checkpoint memory checkpoint =
            checkpointStore.getCheckpoint(l1BlockNumber);

        l1BlockHash = checkpoint.blockHash;
        l1StateRoot = checkpoint.stateRoot;
    }
}
```

## Anchor Transaction Flow

Every L2 block starts with an anchor transaction:

```
1. Taiko node builds L2 block
   └── Gets latest L1 checkpoint from proposer

2. Anchor transaction executes (first tx in block)
   ├── msg.sender = GOLDEN_TOUCH_ADDRESS
   ├── Validates ancestors hash (chain integrity)
   ├── Stores L1 checkpoint in SignalService
   └── Records parent block hash

3. Regular L2 transactions execute
   └── Can access Anchor data (blockHashes, checkpoints)
```

## Ancestors Hash

The ancestors hash provides a succinct commitment to L2 chain history:

```solidity
// Computed from last 255 block hashes + chain ID
bytes32[256] memory inputs;
inputs[255] = bytes32(block.chainid);

for (uint256 i; i < 255 && parentId >= i + 1; ++i) {
    uint256 j = parentId - i - 1;
    inputs[j % 255] = blockhash(j);
}

ancestorsHash = keccak256(abi.encodePacked(inputs));
```

This ensures:
- Chain integrity across blocks
- Efficient verification in ZK proofs
- Detection of chain reorganizations

## Important Notes

1. **Only GOLDEN_TOUCH_ADDRESS** can call `anchorV4()`
2. Anchor transactions have a **fixed gas limit** of 1,000,000
3. Block hashes are only available for the **last 256 blocks**
4. Checkpoints are synced from L1 proposer data
