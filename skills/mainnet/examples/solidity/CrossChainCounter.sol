// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBridge
/// @notice Interface for Taiko Bridge message sending and receiving
interface IBridge {
    struct Message {
        uint64 id;
        uint64 fee;
        uint32 gasLimit;
        address from;
        uint64 srcChainId;
        address srcOwner;
        uint64 destChainId;
        address destOwner;
        address to;
        uint256 value;
        bytes data;
    }

    struct Context {
        bytes32 msgHash;
        address from;
        uint64 srcChainId;
    }

    function sendMessage(Message calldata _message)
        external
        payable
        returns (bytes32 msgHash, Message memory message);

    function context() external view returns (Context memory);
}

/// @title CrossChainCounter
/// @notice Example contract demonstrating bidirectional cross-chain messaging
/// @dev Deploy on both L1 (Ethereum) and L2 (Taiko Alethia) with each other's address
///
/// This example shows:
/// 1. How to send messages from L2 to L1
/// 2. How to receive messages from L1 on L2
/// 3. How to maintain synchronized state across chains
///
/// Deployment:
/// 1. Deploy on L2 (Taiko Alethia) with L2 bridge address
/// 2. Deploy on L1 (Ethereum) with L1 bridge address
/// 3. Call setRemoteCounter() on each with the other's address
///
/// Build with: FOUNDRY_PROFILE=layer2 forge build
contract CrossChainCounter {
    // Bridge addresses
    // L2 (Taiko Alethia): 0x1670000000000000000000000000000000000001
    // L1 (Ethereum):      0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC
    address public immutable bridge;

    // Chain IDs
    uint64 public constant L1_CHAIN_ID = 1; // Ethereum Mainnet
    uint64 public constant L2_CHAIN_ID = 167000; // Taiko Alethia

    // Remote counter contract address (on the other chain)
    address public remoteCounter;

    // Counter state
    uint256 public count;
    uint256 public lastSyncedCount;
    uint64 public lastSyncChainId;

    // Events
    event CountIncremented(uint256 newCount, address by);
    event SyncRequested(uint256 count, uint64 destChainId, bytes32 msgHash);
    event SyncReceived(uint256 count, uint64 srcChainId, address from);

    // Errors
    error NotBridge();
    error NotRemoteCounter();
    error RemoteCounterNotSet();
    error InvalidChainId();

    constructor(address _bridge) {
        bridge = _bridge;
    }

    /// @notice Set the remote counter contract address
    /// @param _remoteCounter Address of CrossChainCounter on the other chain
    function setRemoteCounter(address _remoteCounter) external {
        // In production, add access control here
        remoteCounter = _remoteCounter;
    }

    /// @notice Increment the counter locally
    function increment() external {
        count++;
        emit CountIncremented(count, msg.sender);
    }

    /// @notice Sync the current count to the remote chain
    /// @param _gasLimit Gas limit for the message execution on destination
    /// @dev Requires ETH for the bridge fee
    function syncToRemote(uint32 _gasLimit) external payable {
        if (remoteCounter == address(0)) revert RemoteCounterNotSet();

        // Determine destination chain
        uint64 destChainId = block.chainid == L2_CHAIN_ID ? L1_CHAIN_ID : L2_CHAIN_ID;

        // Encode the sync message
        bytes memory data = abi.encodeCall(this.receiveSync, (count));

        // Create the bridge message
        IBridge.Message memory message = IBridge.Message({
            id: 0, // Assigned by bridge
            fee: 0, // Set by bridge based on msg.value
            gasLimit: _gasLimit,
            from: address(0), // Set by bridge
            srcChainId: 0, // Set by bridge
            srcOwner: msg.sender,
            destChainId: destChainId,
            destOwner: msg.sender,
            to: remoteCounter,
            value: 0,
            data: data
        });

        // Send the message
        (bytes32 msgHash,) = IBridge(bridge).sendMessage{value: msg.value}(message);

        emit SyncRequested(count, destChainId, msgHash);
    }

    /// @notice Receive a sync from the remote chain
    /// @param _count The count value from the remote chain
    /// @dev Only callable by the bridge
    function receiveSync(uint256 _count) external {
        if (msg.sender != bridge) revert NotBridge();

        // Get the message context
        IBridge.Context memory ctx = IBridge(bridge).context();

        // Verify the sender is our remote counter
        if (ctx.from != remoteCounter) revert NotRemoteCounter();

        // Update synced state
        lastSyncedCount = _count;
        lastSyncChainId = ctx.srcChainId;

        emit SyncReceived(_count, ctx.srcChainId, ctx.from);
    }

    /// @notice Get the current chain's role
    /// @return "L1" or "L2" based on chain ID
    function getChainRole() external view returns (string memory) {
        if (block.chainid == L1_CHAIN_ID) return "L1";
        if (block.chainid == L2_CHAIN_ID) return "L2";
        return "Unknown";
    }

    /// @notice Estimate the fee for syncing
    /// @dev This is a simplified estimate; actual fees depend on gas prices
    function estimateSyncFee(uint32 _gasLimit) external view returns (uint256) {
        // Simplified fee estimation
        // In production, query the bridge for actual fee calculation
        return _gasLimit * tx.gasprice;
    }
}

/// @title CrossChainCounterFactory
/// @notice Factory for deploying CrossChainCounter with correct bridge addresses
contract CrossChainCounterFactory {
    // Known bridge addresses
    address public constant L1_BRIDGE = 0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC;
    address public constant L2_BRIDGE = 0x1670000000000000000000000000000000000001;

    event CounterDeployed(address indexed counter, address indexed bridge, uint256 chainId);

    /// @notice Deploy a CrossChainCounter with the correct bridge for this chain
    function deploy() external returns (address) {
        address bridgeAddr;

        if (block.chainid == 1) {
            // L1 Ethereum Mainnet
            bridgeAddr = L1_BRIDGE;
        } else if (block.chainid == 167000) {
            // L2 Taiko Alethia
            bridgeAddr = L2_BRIDGE;
        } else {
            revert("Unsupported chain");
        }

        CrossChainCounter counter = new CrossChainCounter(bridgeAddr);

        emit CounterDeployed(address(counter), bridgeAddr, block.chainid);

        return address(counter);
    }
}
