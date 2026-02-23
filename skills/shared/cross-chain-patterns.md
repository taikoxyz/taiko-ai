# Cross-Chain Patterns

Patterns for L1↔L2 communication on Taiko.

## Overview

Taiko provides two levels of cross-chain communication:

| Level | Contract | Use Case |
|-------|----------|----------|
| Low-level | SignalService | Simple signal verification |
| High-level | Bridge | Message passing with status tracking |

## L1 → L2 Messaging

### Using Bridge

```solidity
// On L1: Send message to L2
contract L1Sender {
    IBridge public bridge;

    function sendToL2(
        address l2Target,
        bytes calldata data,
        uint32 gasLimit
    ) external payable {
        uint64 fee = 0.001 ether;  // Relayer fee

        IBridge.Message memory message = IBridge.Message({
            id: 0,
            fee: uint64(fee),
            gasLimit: gasLimit,
            from: address(0),
            srcChainId: 0,
            srcOwner: msg.sender,
            destChainId: 167013,  // Taiko Hoodi
            destOwner: msg.sender,
            to: l2Target,
            value: msg.value - fee,
            data: data
        });

        bridge.sendMessage{value: msg.value}(message);
    }
}
```

### L2 Receiver

```solidity
// On L2: Receive message from L1
contract L2Receiver {
    IBridge public bridge;
    uint64 public constant L1_CHAIN_ID = 560048;  // Ethereum Hoodi

    function onMessageReceived(uint256 value) external {
        // Verify caller is bridge
        require(msg.sender == address(bridge), "Not bridge");

        // Verify source chain
        IBridge.Context memory ctx = bridge.context();
        require(ctx.srcChainId == L1_CHAIN_ID, "Wrong source");

        // Process the message
        _handleMessage(ctx.from, value);
    }

    function _handleMessage(address sender, uint256 value) internal {
        // Your logic here
    }
}
```

## L2 → L1 Messaging

### Using Bridge

```solidity
// On L2: Send message to L1
contract L2Sender {
    IBridge public bridge;

    function sendToL1(
        address l1Target,
        bytes calldata data,
        uint32 gasLimit
    ) external payable {
        uint64 fee = 0.001 ether;

        IBridge.Message memory message = IBridge.Message({
            id: 0,
            fee: uint64(fee),
            gasLimit: gasLimit,
            from: address(0),
            srcChainId: 0,
            srcOwner: msg.sender,
            destChainId: 560048,  // Ethereum Hoodi
            destOwner: msg.sender,
            to: l1Target,
            value: msg.value - fee,
            data: data
        });

        bridge.sendMessage{value: msg.value}(message);
    }
}
```

## Merkle Proof Verification

For verifying L1 state on L2 (or vice versa):

```solidity
contract StateVerifier {
    ISignalService public signalService;

    function verifyL1Signal(
        address l1Contract,
        bytes32 signal,
        bytes calldata proof
    ) external view returns (bool) {
        // This reverts if proof is invalid
        signalService.verifySignalReceived(
            560048,        // L1 chain ID
            l1Contract,    // Contract that sent signal
            signal,        // Signal to verify
            proof          // Merkle proof
        );
        return true;
    }
}
```

## Token Bridging

### ERC20 Bridge (L1 → L2)

```solidity
// On L1
contract TokenBridger {
    IERC20Vault public vault;
    IERC20 public token;

    function bridgeToL2(uint256 amount, address recipient) external payable {
        // Approve vault
        token.approve(address(vault), amount);

        // Bridge tokens
        vault.sendToken{value: msg.value}(
            IERC20Vault.BridgeTransferOp({
                destChainId: 167013,
                destOwner: recipient,
                to: recipient,
                fee: uint64(msg.value),
                token: address(token),
                gasLimit: 200000,
                amount: amount
            })
        );
    }
}
```

### Receiving Bridged Tokens

Bridged tokens are automatically minted to the recipient. No action needed.

To interact with bridged tokens:

```solidity
// Get bridged token address
address bridgedToken = vault.canonicalToBridged(l1ChainId, l1TokenAddress);

// Use like any ERC20
IERC20(bridgedToken).balanceOf(address);
```

## Checkpoint Synchronization

Access L1 state roots from L2:

```solidity
contract L1StateReader {
    Anchor public anchor;

    function getL1StateRoot(uint48 l1BlockNumber)
        external view returns (bytes32)
    {
        ICheckpointStore store = anchor.checkpointStore();
        ICheckpointStore.Checkpoint memory checkpoint =
            store.getCheckpoint(l1BlockNumber);
        return checkpoint.stateRoot;
    }

    function getLatestL1Block() external view returns (uint48) {
        Anchor.BlockState memory state = anchor.getBlockState();
        return state.anchorBlockNumber;
    }
}
```

## Cross-Chain Counter Example

Complete example of synchronized state:

```solidity
// L1 Contract
contract L1Counter {
    IBridge public bridge;
    uint256 public count;
    address public l2Counter;

    function increment() external payable {
        count++;

        // Notify L2
        bytes memory data = abi.encodeCall(
            IL2Counter.syncCount,
            (count)
        );

        IBridge.Message memory message = IBridge.Message({
            id: 0,
            fee: uint64(msg.value),
            gasLimit: 100000,
            from: address(0),
            srcChainId: 0,
            srcOwner: msg.sender,
            destChainId: 167013,
            destOwner: msg.sender,
            to: l2Counter,
            value: 0,
            data: data
        });

        bridge.sendMessage{value: msg.value}(message);
    }
}

// L2 Contract
contract L2Counter {
    IBridge public bridge;
    uint256 public l1Count;
    address public l1Counter;

    function syncCount(uint256 _count) external {
        require(msg.sender == address(bridge), "Not bridge");

        IBridge.Context memory ctx = bridge.context();
        require(ctx.from == l1Counter, "Wrong sender");

        l1Count = _count;
    }
}
```

## Best Practices

### 1. Always Validate Source

```solidity
IBridge.Context memory ctx = bridge.context();
require(ctx.srcChainId == expectedChain, "Wrong chain");
require(ctx.from == expectedSender, "Wrong sender");
```

### 2. Handle Message Failures

Messages can fail and be retried. Design for idempotency:

```solidity
mapping(bytes32 => bool) public processedMessages;

function onMessage(bytes calldata data) external {
    bytes32 msgHash = bridge.context().msgHash;
    require(!processedMessages[msgHash], "Already processed");
    processedMessages[msgHash] = true;

    // Process message
}
```

### 3. Gas Limit Estimation

Set appropriate gas limits for cross-chain calls:

```solidity
// Estimate gas for the target function
uint32 gasLimit = 200000;  // Add buffer for safety
```

### 4. Fee Handling

Include sufficient fee for relayers:

```solidity
uint64 fee = 0.001 ether;  // Adjust based on gas costs
require(msg.value >= fee, "Insufficient fee");
```

## Chain IDs Reference

| Network | Chain ID |
|---------|----------|
| Ethereum Hoodi (L1) | 560048 |
| Taiko Hoodi (L2) | 167013 |
| Ethereum Mainnet | 1 |
| Taiko Mainnet | 167000 |
