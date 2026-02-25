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

/// @title HelloTaikoCrossChain
/// @notice Bidirectional cross-chain messaging example for any Taiko network
/// @dev Deploy on both L1 and L2, then link via setRemote().
///
/// Build with: FOUNDRY_PROFILE=layer2 forge build
contract HelloTaikoCrossChain {
    address public immutable bridge;
    uint64 public immutable l1ChainId;
    uint64 public immutable l2ChainId;

    address public remote;
    uint256 public count;
    uint256 public lastSyncedCount;
    uint64 public lastSyncChainId;

    event CountIncremented(uint256 newCount, address by);
    event SyncRequested(uint256 count, uint64 destChainId, bytes32 msgHash);
    event SyncReceived(uint256 count, uint64 srcChainId, address from);

    error NotBridge();
    error NotRemote();
    error RemoteNotSet();

    constructor(address _bridge, uint64 _l1ChainId, uint64 _l2ChainId) {
        bridge = _bridge;
        l1ChainId = _l1ChainId;
        l2ChainId = _l2ChainId;
    }

    function setRemote(address _remote) external {
        remote = _remote;
    }

    function increment() external {
        count++;
        emit CountIncremented(count, msg.sender);
    }

    function syncToRemote(uint32 _gasLimit) external payable {
        if (remote == address(0)) revert RemoteNotSet();

        uint64 destChainId = uint64(block.chainid) == l2ChainId ? l1ChainId : l2ChainId;
        bytes memory data = abi.encodeCall(this.receiveSync, (count));

        IBridge.Message memory message = IBridge.Message({
            id: 0, fee: 0, gasLimit: _gasLimit,
            from: address(0), srcChainId: 0,
            srcOwner: msg.sender, destChainId: destChainId,
            destOwner: msg.sender, to: remote,
            value: 0, data: data
        });

        (bytes32 msgHash,) = IBridge(bridge).sendMessage{value: msg.value}(message);
        emit SyncRequested(count, destChainId, msgHash);
    }

    function receiveSync(uint256 _count) external {
        if (msg.sender != bridge) revert NotBridge();
        IBridge.Context memory ctx = IBridge(bridge).context();
        if (ctx.from != remote) revert NotRemote();

        lastSyncedCount = _count;
        lastSyncChainId = ctx.srcChainId;
        emit SyncReceived(_count, ctx.srcChainId, ctx.from);
    }

    function getChainRole() external view returns (string memory) {
        if (uint64(block.chainid) == l1ChainId) return "L1";
        if (uint64(block.chainid) == l2ChainId) return "L2";
        return "Unknown";
    }
}

/// @title HelloTaikoCrossChainFactory
/// @notice Factory that auto-detects bridge addresses from chain ID
contract HelloTaikoCrossChainFactory {
    // Mainnet
    address public constant MAINNET_L1_BRIDGE = 0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC;
    address public constant MAINNET_L2_BRIDGE = 0x1670000000000000000000000000000000000001;
    // Hoodi
    address public constant HOODI_L1_BRIDGE = 0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80;
    address public constant HOODI_L2_BRIDGE = 0x1670130000000000000000000000000000000001;

    event Deployed(address indexed instance, address indexed bridge, uint256 chainId);

    function deploy() external returns (address) {
        address bridgeAddr;
        uint64 l1Id;
        uint64 l2Id;

        if (block.chainid == 1) {
            (bridgeAddr, l1Id, l2Id) = (MAINNET_L1_BRIDGE, 1, 167000);
        } else if (block.chainid == 167000) {
            (bridgeAddr, l1Id, l2Id) = (MAINNET_L2_BRIDGE, 1, 167000);
        } else if (block.chainid == 560048) {
            (bridgeAddr, l1Id, l2Id) = (HOODI_L1_BRIDGE, 560048, 167013);
        } else if (block.chainid == 167013) {
            (bridgeAddr, l1Id, l2Id) = (HOODI_L2_BRIDGE, 560048, 167013);
        } else {
            revert("Unsupported chain");
        }

        HelloTaikoCrossChain instance = new HelloTaikoCrossChain(bridgeAddr, l1Id, l2Id);
        emit Deployed(address(instance), bridgeAddr, block.chainid);
        return address(instance);
    }
}
