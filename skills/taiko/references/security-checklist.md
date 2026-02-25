# Taiko Security Checklist

Taiko-specific security checks for pre-deployment review.

## Taiko-Specific

| Check | Notes |
|-------|-------|
| EVM version | Shanghai (use `FOUNDRY_PROFILE=layer2`) |
| Time logic | Use `block.timestamp`, not block numbers (2-6s blocks) |
| Bridge validation | Verify `msg.sender == bridge` |
| Source chain check | Validate `ctx.srcChainId` |
| Token decimals | USDC=6, USDT=6, WBTC=8, ETH/DAI=18 |

## Cross-Chain Security

```solidity
function onMessageReceived(bytes calldata _data) external {
    require(msg.sender == address(bridge), "Not bridge");
    IBridge.Context memory ctx = bridge.context();
    require(ctx.srcChainId == expectedChain, "Wrong chain");
    require(ctx.from == trustedSender, "Untrusted sender");
    // CEI: effects before interactions
}
```
