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

See [Bridge Interface](./bridge-interface.md#receive-message) for the full receiver pattern. Key checks: verify `msg.sender == bridge`, validate `ctx.srcChainId` and `ctx.from`, then follow CEI ordering.
