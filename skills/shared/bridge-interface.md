# Bridge Interface

The Taiko Bridge provides cross-chain message passing with status tracking, retries, and fund recovery.

## IBridge Interface

```solidity
interface IBridge {
    // ============ Enums ============

    enum Status { NEW, RETRIABLE, DONE, FAILED, RECALLED }
    enum StatusReason {
        INVOCATION_OK,
        INVOCATION_PROHIBITED,
        INVOCATION_FAILED,
        OUT_OF_ETH_QUOTA
    }

    // ============ Structs ============

    struct Message {
        uint64 id;            // Auto-assigned message ID
        uint64 fee;           // Relayer fee
        uint32 gasLimit;      // Gas for message execution
        address from;         // Sender (auto-assigned)
        uint64 srcChainId;    // Source chain (auto-assigned)
        address srcOwner;     // Owner on source chain
        uint64 destChainId;   // Destination chain
        address destOwner;    // Owner on destination chain
        address to;           // Target contract
        uint256 value;        // ETH to send
        bytes data;           // Calldata
    }

    struct Context {
        bytes32 msgHash;
        address from;
        uint64 srcChainId;
    }

    // ============ Events ============

    event MessageSent(bytes32 indexed msgHash, Message message);
    event MessageStatusChanged(bytes32 indexed msgHash, Status status);

    // ============ Functions ============

    /// @notice Send a cross-chain message
    function sendMessage(Message calldata _message)
        external payable
        returns (bytes32 msgHash_, Message memory message_);

    /// @notice Process a received message (called on destination chain)
    function processMessage(Message calldata _message, bytes calldata _proof)
        external
        returns (Status, StatusReason);

    /// @notice Retry a failed message
    function retryMessage(Message calldata _message, bool _isLastAttempt) external;

    /// @notice Mark message as failed (enables recall on source)
    function failMessage(Message calldata _message) external;

    /// @notice Recall funds from a failed message (called on source chain)
    function recallMessage(Message calldata _message, bytes calldata _proof) external;

    /// @notice Get current message context (for receiving contracts)
    function context() external view returns (Context memory ctx_);

    /// @notice Check if a message was sent
    function isMessageSent(Message calldata _message) external view returns (bool);

    /// @notice Get next message ID
    function nextMessageId() external view returns (uint64);

    /// @notice Hash a message
    function hashMessage(Message memory _message) external pure returns (bytes32);
}
```

## Message Status Flow

```
NEW ──────────────────────────────────────────────────────→ DONE
 │                                                            ↑
 │ (execution fails)                                          │
 ↓                                                            │
RETRIABLE ──────────── retryMessage() ────────────────────────┘
 │
 │ (isLastAttempt = true, still fails)
 ↓
FAILED ──────────────── recallMessage() on source ──────→ RECALLED
```

## Sending Messages

```solidity
// 1. Construct message
IBridge.Message memory message = IBridge.Message({
    id: 0,                    // Auto-assigned
    fee: relayerFee,          // Fee for relayer
    gasLimit: 200000,         // Gas for execution
    from: address(0),         // Auto-assigned
    srcChainId: 0,            // Auto-assigned
    srcOwner: msg.sender,     // Owner on source chain
    destChainId: destChainId, // Target chain
    destOwner: recipient,     // Owner on destination
    to: targetContract,       // Contract to call
    value: ethAmount,         // ETH to send
    data: callData            // Function calldata
});

// 2. Send message (pay fee + value)
(bytes32 msgHash, ) = bridge.sendMessage{value: ethAmount + relayerFee}(message);
```

## Receiving Messages

Contracts receiving bridge messages should:

1. Verify the caller is the Bridge
2. Check message context for source chain validation

```solidity
contract BridgeReceiver {
    IBridge public bridge;

    function onMessageReceived(bytes calldata _data) external {
        // Verify caller is bridge
        require(msg.sender == address(bridge), "Not bridge");

        // Get message context
        IBridge.Context memory ctx = bridge.context();

        // Verify source chain
        require(ctx.srcChainId == expectedSourceChain, "Wrong source");

        // Process message data
        // ...
    }
}
```

## Recalling Failed Messages

If a message fails on the destination chain, funds can be recovered:

```solidity
// On source chain, after message marked FAILED on destination
bridge.recallMessage(originalMessage, merkleProof);
// Funds returned to srcOwner
```

## SignalService (Low-Level)

For lower-level signal sending without the Bridge abstraction:

```solidity
interface ISignalService {
    /// @notice Send a signal
    function sendSignal(bytes32 _signal) external returns (bytes32 slot_);

    /// @notice Verify a signal was sent on another chain
    function verifySignalReceived(
        uint64 _chainId,
        address _app,
        bytes32 _signal,
        bytes calldata _proof
    ) external view;

    /// @notice Get the storage slot for a signal
    function getSignalSlot(uint64 _chainId, address _app, bytes32 _signal)
        external pure returns (bytes32);
}
```

## Signal Slot Computation

Signals are stored at deterministic slots:

```solidity
function getSignalSlot(uint64 _chainId, address _app, bytes32 _signal)
    public pure returns (bytes32)
{
    return keccak256(abi.encodePacked("SIGNAL", _chainId, _app, _signal));
}
```
