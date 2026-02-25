# Anchor Contract

First transaction in every L2 block. Syncs L1 data to L2.

## Key Constants

```solidity
GOLDEN_TOUCH_ADDRESS = 0x0000777735367b36bC9B61C50022d9D0700dB4Ec  // Executes anchor tx
ANCHOR_GAS_LIMIT = 1_000_000
```

## Public Functions

### Block Hashes (last 256 blocks)

```solidity
bytes32 hash = Anchor(anchorAddr).blockHashes(block.number - 1);
```

### Block State

```solidity
Anchor.BlockState memory state = anchor.getBlockState();
uint48 l1BlockNum = state.anchorBlockNumber;
bytes32 ancestorsHash = state.ancestorsHash;
```

### L1 Chain ID

```solidity
uint64 l1ChainId = anchor.l1ChainId();
```

### Checkpoint Access (L1 state roots)

```solidity
ICheckpointStore store = anchor.checkpointStore();
ICheckpointStore.Checkpoint memory cp = store.getCheckpoint(l1BlockNumber);
// cp.blockHash, cp.stateRoot
```

## Complete Example

```solidity
contract L1DataReader {
    Anchor public anchor;

    function getL1Info() external view returns (uint48 blockNum, bytes32 stateRoot) {
        Anchor.BlockState memory state = anchor.getBlockState();
        blockNum = state.anchorBlockNumber;
        ICheckpointStore.Checkpoint memory cp =
            anchor.checkpointStore().getCheckpoint(blockNum);
        stateRoot = cp.stateRoot;
    }
}
```

## Anchor Transaction Flow

1. Node builds L2 block with latest L1 checkpoint
2. Anchor tx executes first (GOLDEN_TOUCH_ADDRESS)
   - Validates ancestors hash (chain integrity)
   - Stores L1 checkpoint in SignalService
   - Records parent block hash
3. Regular L2 transactions execute

## Notes

- Only GOLDEN_TOUCH_ADDRESS can call `anchorV4()`
- Block hashes available for last 256 blocks only
- Ancestors hash = rolling commitment to L2 chain history
