# Cross-Chain Patterns

L1↔L2 communication patterns for Taiko.

## Communication Levels

| Level | Contract | Use Case |
|-------|----------|----------|
| Low-level | SignalService | Simple signal verification |
| High-level | Bridge | Message passing with status tracking |

## Chain IDs

| Network | Chain ID |
|---------|----------|
| Ethereum Hoodi (L1) | 560048 |
| Taiko Hoodi (L2) | 167013 |
| Ethereum Mainnet | 1 |
| Taiko Mainnet | 167000 |

## Sending Messages (Either Direction)

```solidity
contract CrossChainSender {
    IBridge public bridge;

    function send(address target, bytes calldata data, uint64 destChainId) external payable {
        uint64 fee = 0.001 ether;

        bridge.sendMessage{value: msg.value}(IBridge.Message({
            id: 0, fee: uint64(fee), gasLimit: 200000,
            from: address(0), srcChainId: 0,  // auto-assigned
            srcOwner: msg.sender, destOwner: msg.sender,
            destChainId: destChainId,
            to: target, value: msg.value - fee, data: data
        }));
    }
}
```

## Receiving Messages

```solidity
contract BridgeReceiver {
    IBridge public bridge;
    uint64 public expectedSourceChain;
    mapping(bytes32 => bool) public processed;  // Replay protection

    function onMessageReceived(bytes calldata data) external {
        require(msg.sender == address(bridge), "Not bridge");

        IBridge.Context memory ctx = bridge.context();
        require(ctx.srcChainId == expectedSourceChain, "Wrong chain");
        require(!processed[ctx.msgHash], "Replayed");
        processed[ctx.msgHash] = true;

        // Process data...
    }
}
```

## Signal Verification (Low-Level)

```solidity
contract StateVerifier {
    ISignalService public signalService;

    function verifySignal(uint64 chainId, address app, bytes32 signal, bytes calldata proof)
        external view returns (bool)
    {
        signalService.verifySignalReceived(chainId, app, signal, proof);
        return true;  // Reverts if invalid
    }
}
```

## Token Bridging

```solidity
function bridgeTokens(IERC20 token, uint256 amount, address recipient, uint64 destChainId)
    external payable
{
    token.approve(address(vault), amount);
    vault.sendToken{value: msg.value}(IERC20Vault.BridgeTransferOp({
        destChainId: destChainId, destOwner: recipient, to: recipient,
        fee: uint64(msg.value), token: address(token),
        gasLimit: 200000, amount: amount
    }));
}

// Receiving: Bridged tokens auto-mint to recipient
// Get address: vault.canonicalToBridged(srcChainId, tokenAddress)
```

### Bridging without a separate approval

`sendTokenWithPermit` (EIP-2612) and `sendTokenWithPermit2` (Uniswap Permit2) fold the
approval into the bridge transaction. Both work the same way on Ethereum and Taiko. See
[Bridge Interface](./bridge-interface.md#approval-free-bridging-permit--permit2) for the
semantics — including the deliberately best-effort permit — and for the availability caveat.

Because the vault pulls from `msg.sender` and the signature must be the caller's, these are
EOA/wallet-facing entrypoints. A contract cannot forward a user's permit signature through
itself: `msg.sender` at the vault would be the contract, not the signer.

```javascript
// EIP-2612 — one transaction, no approve
const { v, r, s } = splitSignature(await signer.signTypedData(...));  // token's Permit domain
await vault.sendTokenWithPermit(op, deadline, v, r, s, { value: fee });

// Permit2 — any ERC20, after a one-time token.approve(PERMIT2, max)
await vault.sendTokenWithPermit2(op, nonce, deadline, signature, { value: fee });
```

The Permit2 signature must authorize exactly `op.amount` of `op.token` with `to` set to the
vault. Passing the signature as raw `bytes` lets a smart-contract wallet authorize the transfer
with EIP-1271, which a split `(v, r, s)` cannot express.

## L1 State from L2 (via Anchor)

```solidity
contract L1StateReader {
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

## Best Practices

| Practice | Implementation |
|----------|----------------|
| Validate source | Check `ctx.srcChainId` and `ctx.from` |
| Replay protection | Track `ctx.msgHash` in mapping |
| Idempotent handlers | Design for retry scenarios |
| Gas limits | Set appropriate gasLimit (add buffer) |
| Fee handling | `msg.value >= fee + value` |
