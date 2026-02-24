---
name: hoodi
description: Deploy, test, and interact with smart contracts on Taiko Hoodi testnet using Foundry. Use when "Taiko testnet", "Taiko Hoodi", or "testnet deployment" is mentioned.
---

# Taiko Hoodi Development

Build, deploy, and verify smart contracts on Taiko Hoodi (testnet).

## Quick Reference

| Property | Value |
|----------|-------|
| Chain ID | `167013` |
| RPC URL | `https://rpc.hoodi.taiko.xyz` |
| Currency | ETH |
| Block Explorer | `https://hoodi.taikoscan.io` |
| EVM Version | Shanghai (Type-1 ZK-EVM) |
| Solidity | `^0.8.24` (protocol uses `0.8.30`) |
| x402 Facilitator | `https://facilitator.taiko.xyz` |

## Quick Decision Guide

| Task | Command/Resource |
|------|------------------|
| Deploy contract | `FOUNDRY_PROFILE=layer2 forge create ...` |
| Verify on Taikoscan | `forge verify-contract ...` |
| Verify on Blockscout | `forge verify-contract --verifier blockscout ...` |
| Bridge assets | https://bridge.hoodi.taiko.xyz |
| Get test ETH | See [network-config.md](./references/network-config.md) |
| Fork testing | `FOUNDRY_PROFILE=layer2 forge test --fork-url ...` |

## Shared Protocol Knowledge

Before deploying, review these shared resources:

- [Protocol Overview](../shared/protocol-overview.md) - Based rollup architecture
- [EVM Compatibility](../shared/evm-compatibility.md) - Shanghai EVM details
- [Foundry Guide](../shared/foundry-guide.md) - Complete Foundry setup
- [Security Checklist](../shared/security-checklist.md) - Pre-deployment checks
- [Bridge Interface](../shared/bridge-interface.md) - Cross-chain messaging
- [Cross-Chain Patterns](../shared/cross-chain-patterns.md) - L1↔L2 patterns

## Network-Specific References

- [Contract Addresses](./references/contract-addresses.md) - L1/L2 protocol addresses
- [Network Configuration](./references/network-config.md) - RPC, gas, faucets

## Foundry Setup

Use `assets/foundry-template/` as a starting point.

**Critical:** Always use `FOUNDRY_PROFILE=layer2` for Taiko L2:

```bash
# Build with Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Test with fork
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz
```

### foundry.toml Configuration

```toml
[profile.default]
solc_version = "0.8.30"
evm_version = "prague"

# Use for Taiko L2
[profile.layer2]
evm_version = "shanghai"

[rpc_endpoints]
taiko-hoodi = "https://rpc.hoodi.taiko.xyz"

[etherscan]
taiko-hoodi = { key = "${TAIKOSCAN_API_KEY}", url = "https://api-hoodi.taikoscan.io/api", chain = 167013 }
```

## Deploy Commands

### Basic Deployment

```bash
FOUNDRY_PROFILE=layer2 forge create src/MyContract.sol:MyContract \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### With Constructor Arguments

```bash
FOUNDRY_PROFILE=layer2 forge create src/Token.sol:Token \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args "TokenName" "TKN" 1000000000000000000000000
```

### Using Scripts

```bash
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Verify Commands

### Taikoscan

```bash
forge verify-contract <CONTRACT_ADDRESS> src/MyContract.sol:MyContract \
  --watch \
  --verifier-url https://api-hoodi.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY
```

### Blockscout

```bash
forge verify-contract <CONTRACT_ADDRESS> src/MyContract.sol:MyContract \
  --chain-id 167013 \
  --verifier blockscout \
  --verifier-url https://blockscout.hoodi.taiko.xyz/api
```

## Testing on Taiko

```bash
# Fork Taiko testnet for testing
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz

# Run specific test with fork
FOUNDRY_PROFILE=layer2 forge test --match-test testBridgeInteraction --fork-url https://rpc.hoodi.taiko.xyz -vvv

# Gas report
FOUNDRY_PROFILE=layer2 forge test --gas-report --fork-url https://rpc.hoodi.taiko.xyz
```

## Bridging Assets

To deploy contracts, you need ETH on Taiko Hoodi:

1. **Get ETH on Ethereum Hoodi** - Use faucets (see [network-config.md](./references/network-config.md))
2. **Bridge to Taiko Hoodi** - https://bridge.hoodi.taiko.xyz

## Cast CLI Commands

```bash
# Check ETH balance
cast balance <ADDRESS> --rpc-url https://rpc.hoodi.taiko.xyz

# Get chain ID
cast chain-id --rpc-url https://rpc.hoodi.taiko.xyz

# Get block number
cast block-number --rpc-url https://rpc.hoodi.taiko.xyz

# Get gas price
cast gas-price --rpc-url https://rpc.hoodi.taiko.xyz

# Send transaction
cast send <TO> "functionName(args)" --rpc-url https://rpc.hoodi.taiko.xyz --private-key $PRIVATE_KEY
```

## Examples

See `examples/` directory for:
- **Python**: Block hash calculation, signal verification
- **Solidity**: Bridge receiver, cross-chain contracts

## Useful Tools

- **Code Diff**: https://codediff.taiko.xyz - Compare contract implementations
- **Status Page**: https://status.taiko.xyz - Network status

## x402 Payments

Taiko runs an [x402](https://www.x402.org) facilitator for HTTP-native payments on Hoodi.

| Property | Value |
|----------|-------|
| Facilitator URL | `https://facilitator.taiko.xyz` |
| Network | `eip155:167013` |
| Scheme | `exact` |
| x402 Version | `2` |
| Signer | `0x81062a8b93fc840225bf879829145e3840057CD4` |

Endpoints: `POST /verify`, `POST /settle`, `GET /supported`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid EVM version" | Use `FOUNDRY_PROFILE=layer2` |
| "Contract not verified" | Check API endpoint URL and key |
| "Insufficient funds" | Get test ETH from faucets, bridge to L2 |
| "Transaction reverted" | Use `cast run <TX_HASH>` to debug |
| Build fails with PUSH0 | Ensure using Shanghai EVM |

## Protocol Source

- Latest releases: https://github.com/taikoxyz/taiko-mono/releases?q=alethia-protocol
- Protocol source: https://github.com/taikoxyz/taiko-mono/tree/main/packages/protocol
