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

## IERC20Vault

Token bridging goes through the ERC20Vault, not `sendMessage` directly. The vault pulls the
tokens from `msg.sender`, then sends the bridge message itself.

```solidity
interface IERC20Vault {
    struct BridgeTransferOp {
        uint64 destChainId;
        address destOwner;   // owner of the message on the destination chain
        address to;          // recipient
        uint64 fee;          // relayer fee
        address token;
        uint32 gasLimit;
        uint256 amount;
    }

    // Requires a prior token.approve(vault, amount)
    function sendToken(BridgeTransferOp calldata op)
        external payable returns (IBridge.Message memory);

    // EIP-2612: sets the vault's allowance from a signature, no approve tx
    function sendTokenWithPermit(
        BridgeTransferOp calldata op,
        uint256 deadline, uint8 v, bytes32 r, bytes32 s
    ) external payable returns (IBridge.Message memory);

    // Permit2: pulls via SignatureTransfer, works for any ERC20
    function sendTokenWithPermit2(
        BridgeTransferOp calldata op,
        uint256 nonce, uint256 deadline, bytes calldata signature
    ) external payable returns (IBridge.Message memory);
}
```

### Approval-free bridging (permit / Permit2)

Both variants are available on Ethereum and Taiko alike and remove the separate `approve`
transaction. The caller must be the signer in both cases.

| | `sendTokenWithPermit` | `sendTokenWithPermit2` |
|-|----------------------|------------------------|
| Standard | EIP-2612 | Uniswap Permit2 |
| Token support | Only tokens implementing EIP-2612 | Any ERC20 |
| Prerequisite | None | One-time `token.approve(PERMIT2, ...)` |
| Signature | Split `(v, r, s)` | Raw `bytes` — allows EIP-1271 smart-wallet signatures |
| Replay of a used signature | Tolerated (see below) | Reverts |

Permit2 is at `0x000000000022D473030F116dDEE9F6B43aC78BA3` on every chain — it is deployed via
the deterministic deployer, so no per-chain configuration is needed.

**The EIP-2612 permit is best-effort.** A failing `permit` is swallowed rather than reverting,
because anyone can front-run the call by replaying the same signature straight at the token,
which burns the nonce and would otherwise strand the bridge transaction. Only the resulting
allowance matters, so the token pull reverts on its own if the allowance is genuinely absent.

Two consequences worth designing around:

- EIP-2612 `permit` **sets** the allowance rather than adding to it. A caller holding a larger
  standing allowance for the vault sees it replaced by `amount` and spent to zero. That only
  ever reduces standing approval, but if you keep a long-lived allowance, use `sendToken`.
- A caller who already has sufficient allowance bridges successfully even with a bad
  signature. That is intended — the caller is the token owner and asked for this transfer.

> **Availability:** these two entrypoints require an ERC20Vault upgraded to a build that
> includes them. Older deployments expose only `sendToken`. Treat a revert or a missing-selector
> error as "this vault predates permit support" and fall back to `approve` + `sendToken`; do not
> assume it means the signature was bad.

## ISignalService (Low-Level)

```solidity
interface ISignalService {
    function sendSignal(bytes32 signal) external returns (bytes32 slot);
    function verifySignalReceived(uint64 chainId, address app, bytes32 signal, bytes calldata proof) external view;
    function getSignalSlot(uint64 chainId, address app, bytes32 signal) external pure returns (bytes32);
}

// Slot = keccak256(abi.encodePacked("SIGNAL", chainId, app, signal))
```
