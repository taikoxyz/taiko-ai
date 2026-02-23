# Security Checklist

Security considerations for smart contracts deployed on Taiko.

## Pre-Deployment Checklist

### General Security

| # | Check | Status |
|---|-------|--------|
| 1 | Access control on all admin functions | [ ] |
| 2 | Reentrancy protection (CEI pattern + nonReentrant) | [ ] |
| 3 | Integer overflow handled (Solidity 0.8+ or SafeMath) | [ ] |
| 4 | Return values checked (use SafeERC20 for tokens) | [ ] |
| 5 | Input validation on all external functions | [ ] |
| 6 | Events emitted for all state changes | [ ] |
| 7 | No hardcoded addresses that vary by network | [ ] |
| 8 | Emergency pause functionality if needed | [ ] |

### Taiko-Specific Considerations

| # | Check | Status |
|---|-------|--------|
| 1 | EVM version set to Shanghai for deployment | [ ] |
| 2 | Block time assumptions use timestamp, not block number | [ ] |
| 3 | Cross-chain message validation includes source chain check | [ ] |
| 4 | Bridge callbacks verify msg.sender is Bridge contract | [ ] |
| 5 | Token decimals handled correctly (USDC = 6, not 18) | [ ] |
| 6 | Gas limits account for Taiko's higher limits | [ ] |

## Cross-Chain Security

### Bridge Message Validation

Always verify the source of bridge messages:

```solidity
contract SecureBridgeReceiver {
    IBridge public bridge;
    uint64 public expectedSourceChain;

    function onMessageReceived(bytes calldata _data) external {
        // 1. Verify caller is bridge
        require(msg.sender == address(bridge), "Not bridge");

        // 2. Get and verify context
        IBridge.Context memory ctx = bridge.context();
        require(ctx.srcChainId == expectedSourceChain, "Wrong source chain");
        require(ctx.from == trustedSender, "Untrusted sender");

        // 3. Process message
        // ...
    }
}
```

### Reentrancy in Cross-Chain Calls

Bridge callbacks can be exploited for reentrancy:

```solidity
// BAD: State change after external call
function onMessageReceived(bytes calldata _data) external {
    (address to, uint256 amount) = abi.decode(_data, (address, uint256));
    IERC20(token).transfer(to, amount);  // External call
    balances[to] += amount;               // State change after - vulnerable!
}

// GOOD: CEI pattern + nonReentrant
function onMessageReceived(bytes calldata _data) external nonReentrant {
    (address to, uint256 amount) = abi.decode(_data, (address, uint256));
    balances[to] += amount;               // State change first
    IERC20(token).safeTransfer(to, amount);  // External call last
}
```

## Token Handling

### Decimal Awareness

```solidity
// WRONG: Assuming 18 decimals
uint256 amount = 1000 * 1e18;  // Wrong for USDC!

// RIGHT: Check decimals
uint8 decimals = IERC20Metadata(token).decimals();
uint256 amount = 1000 * (10 ** decimals);
```

### Common Token Decimals

| Token | Decimals |
|-------|----------|
| ETH/WETH | 18 |
| USDC | 6 |
| USDT | 6 |
| WBTC | 8 |
| DAI | 18 |

### SafeERC20 Usage

Always use SafeERC20 for token operations:

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TokenHandler {
    using SafeERC20 for IERC20;

    function transferTokens(IERC20 token, address to, uint256 amount) external {
        token.safeTransfer(to, amount);  // Handles non-standard tokens
    }
}
```

## Common Vulnerabilities

### 1. Reentrancy

```solidity
// Use checks-effects-interactions pattern
function withdraw(uint256 amount) external nonReentrant {
    // Checks
    require(balances[msg.sender] >= amount, "Insufficient");

    // Effects
    balances[msg.sender] -= amount;

    // Interactions
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
```

### 2. Front-Running

For sensitive operations, consider:
- Commit-reveal schemes
- Slippage protection
- Deadline parameters

### 3. Oracle Manipulation

```solidity
// BAD: Using spot price
uint256 price = uniswapPair.getSpotPrice();

// GOOD: Using TWAP or Chainlink
uint256 price = chainlinkOracle.latestAnswer();
require(block.timestamp - oracle.updatedAt < 1 hours, "Stale price");
```

### 4. Signature Replay

```solidity
// Include chain ID and nonce in signed messages
bytes32 hash = keccak256(abi.encodePacked(
    "\x19\x01",
    DOMAIN_SEPARATOR,  // Includes chain ID
    keccak256(abi.encode(
        TYPEHASH,
        msg.sender,
        nonce++,  // Prevent replay
        deadline,
        data
    ))
));
```

## Testing Requirements

Before deployment:

| Test Type | Coverage |
|-----------|----------|
| Unit tests | All functions |
| Integration tests | Cross-contract interactions |
| Fork tests | Against live Taiko state |
| Fuzz tests | Edge cases and overflow |
| Invariant tests | Critical properties |

```bash
# Run all tests with fork
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz -vvv

# Run with coverage
FOUNDRY_PROFILE=layer2 forge coverage --fork-url https://rpc.hoodi.taiko.xyz
```

## Audit Recommendations

For production contracts:

1. **Internal review** - Team code review
2. **Static analysis** - Slither, Mythril
3. **Formal verification** - For critical components
4. **External audit** - Professional security audit
5. **Bug bounty** - Post-launch vulnerability rewards

## Emergency Response

Include emergency controls:

```solidity
contract EmergencyControls is Ownable, Pausable {
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function criticalFunction() external whenNotPaused {
        // ...
    }
}
```
