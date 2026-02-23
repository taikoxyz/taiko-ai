// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBridge
/// @notice Minimal interface for Taiko Bridge message receiving
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

    function context() external view returns (Context memory);
}

/// @title BridgeReceiver
/// @notice Example contract demonstrating how to receive cross-chain messages on Taiko
/// @dev This contract can be called by the Bridge when processing messages from L1
///
/// Usage:
/// 1. Deploy this contract on Taiko L2
/// 2. From L1, send a bridge message with this contract as the `to` address
/// 3. The bridge will call `onMessageReceived` with the message data
///
/// Build with: FOUNDRY_PROFILE=layer2 forge build
contract BridgeReceiver {
    // Taiko Hoodi Bridge address
    address public constant BRIDGE = 0x1670130000000000000000000000000000000001;

    // Events for tracking received messages
    event MessageReceived(
        address indexed from,
        uint64 indexed srcChainId,
        bytes32 msgHash,
        bytes data
    );

    event ValueReceived(
        address indexed from,
        uint256 value
    );

    // Storage for received messages
    mapping(bytes32 => bool) public processedMessages;
    uint256 public messageCount;
    uint256 public totalValueReceived;

    /// @notice Modifier to ensure caller is the bridge
    modifier onlyBridge() {
        require(msg.sender == BRIDGE, "BridgeReceiver: caller is not bridge");
        _;
    }

    /// @notice Called by the bridge when a message is received
    /// @param _data The message data sent from the source chain
    /// @dev Override this function to implement custom message handling
    function onMessageReceived(bytes calldata _data) external payable onlyBridge {
        // Get the message context from the bridge
        IBridge.Context memory ctx = IBridge(BRIDGE).context();

        // Verify message hasn't been processed (replay protection)
        require(!processedMessages[ctx.msgHash], "BridgeReceiver: message already processed");

        // Mark as processed
        processedMessages[ctx.msgHash] = true;
        messageCount++;

        // Track any ETH sent with the message
        if (msg.value > 0) {
            totalValueReceived += msg.value;
            emit ValueReceived(ctx.from, msg.value);
        }

        // Emit event for off-chain tracking
        emit MessageReceived(ctx.from, ctx.srcChainId, ctx.msgHash, _data);

        // Process the message data
        _processMessage(ctx.from, ctx.srcChainId, _data);
    }

    /// @notice Internal function to process message data
    /// @param _from The sender address on the source chain
    /// @param _srcChainId The source chain ID
    /// @param _data The message data
    /// @dev Override this in derived contracts for custom logic
    function _processMessage(
        address _from,
        uint64 _srcChainId,
        bytes calldata _data
    ) internal virtual {
        // Default implementation: decode and store the message
        // Derived contracts can override this for custom handling

        // Example: if data is an address, you could whitelist it
        // Example: if data is a uint256, you could update state
        // Example: if data is encoded function call, you could execute it
    }

    /// @notice Check if a message has been processed
    /// @param _msgHash The message hash to check
    /// @return True if the message has been processed
    function isProcessed(bytes32 _msgHash) external view returns (bool) {
        return processedMessages[_msgHash];
    }

    /// @notice Allow contract to receive ETH
    receive() external payable {
        totalValueReceived += msg.value;
        emit ValueReceived(msg.sender, msg.value);
    }
}

/// @title WhitelistReceiver
/// @notice Example: A contract that whitelists addresses from L1
contract WhitelistReceiver is BridgeReceiver {
    // L1 admin address that can whitelist
    address public immutable l1Admin;

    // Whitelist storage
    mapping(address => bool) public whitelist;

    event AddressWhitelisted(address indexed addr, address indexed by, uint64 srcChainId);

    constructor(address _l1Admin) {
        l1Admin = _l1Admin;
    }

    function _processMessage(
        address _from,
        uint64 _srcChainId,
        bytes calldata _data
    ) internal override {
        // Only accept messages from our L1 admin
        require(_from == l1Admin, "WhitelistReceiver: unauthorized sender");

        // Decode the address to whitelist
        address toWhitelist = abi.decode(_data, (address));

        // Add to whitelist
        whitelist[toWhitelist] = true;

        emit AddressWhitelisted(toWhitelist, _from, _srcChainId);
    }
}
