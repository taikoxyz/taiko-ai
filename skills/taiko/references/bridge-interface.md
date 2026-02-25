# Bridge Interface

Cross-chain message passing with status tracking, retries, and fund recovery.

## IBridge

```solidity
interface IBridge {
    enum Status { NEW, RETRIABLE, DONE, FAILED, RECALLED }

    struct Message {
        uint64 id;            // Auto-assigned
        uint64 fee;           // Relayer fee
        uint32 gasLimit;      // Gas for execution
        address from;         // Auto-assigned
        uint64 srcChainId;    // Auto-assigned
        address srcOwner;     // Owner on source chain
        uint64 destChainId;   // Destination chain
        address destOwner;    // Owner on destination
        address to;           // Target contract
        uint256 value;        // ETH to send
        bytes data;           // Calldata
    }

    struct Context { bytes32 msgHash; address from; uint64 srcChainId; }

    function sendMessage(Message calldata) external payable returns (bytes32 msgHash, Message memory);
    function processMessage(Message calldata, bytes calldata proof) external returns (Status, StatusReason);
    function retryMessage(Message calldata, bool isLastAttempt) external;
    function recallMessage(Message calldata, bytes calldata proof) external;
    function context() external view returns (Context memory);
}
```

## Status Flow

```
NEW → DONE (success)
NEW → RETRIABLE → DONE (retry succeeds)
NEW → RETRIABLE → FAILED → RECALLED (final failure, funds returned)
```

## Send Message

```solidity
IBridge.Message memory msg = IBridge.Message({
    id: 0, fee: relayerFee, gasLimit: 200000,
    from: address(0), srcChainId: 0,  // auto-assigned
    srcOwner: msg.sender, destOwner: recipient,
    destChainId: destChainId, to: target,
    value: ethAmount, data: callData
});
bridge.sendMessage{value: ethAmount + relayerFee}(msg);
```

## Receive Message

```solidity
function onMessageReceived(bytes calldata _data) external {
    require(msg.sender == address(bridge), "Not bridge");
    IBridge.Context memory ctx = bridge.context();
    require(ctx.srcChainId == expectedChain, "Wrong source");
    // Process _data
}
```

## Recall Failed

```solidity
// On source chain after message marked FAILED
bridge.recallMessage(originalMessage, merkleProof);
// Funds returned to srcOwner
```

## ISignalService (Low-Level)

```solidity
interface ISignalService {
    function sendSignal(bytes32 signal) external returns (bytes32 slot);
    function verifySignalReceived(uint64 chainId, address app, bytes32 signal, bytes calldata proof) external view;
    function getSignalSlot(uint64 chainId, address app, bytes32 signal) external pure returns (bytes32);
}

// Slot = keccak256(abi.encodePacked("SIGNAL", chainId, app, signal))
```
