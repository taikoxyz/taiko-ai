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
/// @notice Receive cross-chain messages on any Taiko network
/// @dev Auto-detects bridge address from chain ID.
///      Mainnet L2 bridge: 0x1670000000000000000000000000000000000001
///      Hoodi L2 bridge:   0x1670130000000000000000000000000000000001
///
/// Build with: FOUNDRY_PROFILE=layer2 forge build
contract BridgeReceiver {
    address public immutable bridge;

    event MessageReceived(address indexed from, uint64 indexed srcChainId, bytes32 msgHash, bytes data);
    event ValueReceived(address indexed from, uint256 value);

    mapping(bytes32 => bool) public processedMessages;
    uint256 public messageCount;
    uint256 public totalValueReceived;

    constructor() {
        bridge = _detectBridge();
    }

    function _detectBridge() internal view returns (address) {
        if (block.chainid == 167000) return 0x1670000000000000000000000000000000000001;
        if (block.chainid == 167013) return 0x1670130000000000000000000000000000000001;
        revert("BridgeReceiver: unsupported chain");
    }

    modifier onlyBridge() {
        require(msg.sender == bridge, "BridgeReceiver: caller is not bridge");
        _;
    }

    /// @notice Called by the bridge when a message is received
    function onMessageReceived(bytes calldata _data) external payable onlyBridge {
        IBridge.Context memory ctx = IBridge(bridge).context();
        require(!processedMessages[ctx.msgHash], "BridgeReceiver: already processed");

        processedMessages[ctx.msgHash] = true;
        messageCount++;

        if (msg.value > 0) {
            totalValueReceived += msg.value;
            emit ValueReceived(ctx.from, msg.value);
        }

        emit MessageReceived(ctx.from, ctx.srcChainId, ctx.msgHash, _data);
        _processMessage(ctx.from, ctx.srcChainId, _data);
    }

    /// @notice Override in derived contracts for custom logic
    function _processMessage(address _from, uint64 _srcChainId, bytes calldata _data) internal virtual {}

    function isProcessed(bytes32 _msgHash) external view returns (bool) {
        return processedMessages[_msgHash];
    }

    receive() external payable {
        totalValueReceived += msg.value;
        emit ValueReceived(msg.sender, msg.value);
    }
}

/// @title WhitelistReceiver
/// @notice Example: whitelist addresses from L1
contract WhitelistReceiver is BridgeReceiver {
    address public immutable l1Admin;
    mapping(address => bool) public whitelist;

    event AddressWhitelisted(address indexed addr, address indexed by, uint64 srcChainId);

    constructor(address _l1Admin) {
        l1Admin = _l1Admin;
    }

    function _processMessage(address _from, uint64 _srcChainId, bytes calldata _data) internal override {
        require(_from == l1Admin, "WhitelistReceiver: unauthorized sender");
        address toWhitelist = abi.decode(_data, (address));
        whitelist[toWhitelist] = true;
        emit AddressWhitelisted(toWhitelist, _from, _srcChainId);
    }
}
