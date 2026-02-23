# Security Checklist

Pre-deployment security checklist for Taiko contracts.

## General Security

| Check | Notes |
|-------|-------|
| Access control | Admin functions protected (Ownable/AccessControl) |
| Reentrancy | CEI pattern + `nonReentrant` modifier |
| Integer safety | Solidity 0.8+ or SafeMath |
| Return values | Use SafeERC20 for tokens |
| Input validation | Zero address, bounds checking |
| Events | Emit for all state changes |
| No hardcoded addresses | Use address constants/config |
| Emergency pause | Pausable if needed |

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

## Common Vulnerabilities

| Vulnerability | Prevention |
|---------------|------------|
| Reentrancy | CEI pattern, `nonReentrant`, SafeERC20 |
| Front-running | Commit-reveal, slippage protection, deadlines |
| Oracle manipulation | TWAP or Chainlink, check staleness |
| Signature replay | Include chainId + nonce in signed data |

## SafeERC20

```solidity
using SafeERC20 for IERC20;
token.safeTransfer(to, amount);  // Handles non-standard tokens
```

## Testing Requirements

| Type | Purpose |
|------|---------|
| Unit | All functions |
| Fork | Against live Taiko state |
| Fuzz | Edge cases, overflow |
| Invariant | Critical properties |

## Audit Path

1. Internal review → 2. Static analysis (Slither) → 3. External audit → 4. Bug bounty
