---
name: mainnet
description: Deploy, test, and interact with smart contracts on Taiko Alethia mainnet using Foundry. Use when "Taiko mainnet", "Taiko Alethia", or "mainnet deployment" is mentioned.
---

# Taiko Mainnet Development

Build, deploy, and verify smart contracts on Taiko Alethia (mainnet).

## Quick Reference

| Property | Value |
|----------|-------|
| Chain ID | `167000` |
| RPC URL | `https://rpc.mainnet.taiko.xyz` |
| Currency | ETH |
| Block Explorer | `https://taikoscan.io` |
| EVM Version | Shanghai (Type-1 ZK-EVM) |
| Solidity | `^0.8.24` (protocol uses `0.8.30`) |
| x402 Facilitators | `https://facilitator.taiko.xyz`, `https://x402.taiko.xyz` |

## Quick Decision Guide

| Task | Command/Resource |
|------|------------------|
| Deploy contract | `FOUNDRY_PROFILE=layer2 forge create ...` |
| Verify on Taikoscan | `forge verify-contract ...` |
| Verify on Blockscout | `forge verify-contract --verifier blockscout ...` |
| Bridge assets | https://bridge.taiko.xyz |
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
- [Network Configuration](./references/network-config.md) - RPC, gas, explorers

## Foundry Setup

Use `assets/foundry-template/` as a starting point.

**Critical:** Always use `FOUNDRY_PROFILE=layer2` for Taiko L2:

```bash
# Build with Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Test with fork
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz
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
taiko-mainnet = "https://rpc.mainnet.taiko.xyz"

[etherscan]
taiko-mainnet = { key = "${TAIKOSCAN_API_KEY}", url = "https://api.taikoscan.io/api", chain = 167000 }
```

## Deploy Commands

### Basic Deployment

```bash
FOUNDRY_PROFILE=layer2 forge create src/MyContract.sol:MyContract \
  --rpc-url https://rpc.mainnet.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### With Constructor Arguments

```bash
FOUNDRY_PROFILE=layer2 forge create src/Token.sol:Token \
  --rpc-url https://rpc.mainnet.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args "TokenName" "TKN" 1000000000000000000000000
```

### Using Scripts

```bash
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.mainnet.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Verify Commands

### Taikoscan

```bash
forge verify-contract <CONTRACT_ADDRESS> src/MyContract.sol:MyContract \
  --watch \
  --verifier-url https://api.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY
```

### Blockscout

```bash
forge verify-contract <CONTRACT_ADDRESS> src/MyContract.sol:MyContract \
  --chain-id 167000 \
  --verifier blockscout \
  --verifier-url https://blockscoutapi.mainnet.taiko.xyz/api?
```

### Etherscan V2 (Unified API)

```bash
forge verify-contract <CONTRACT_ADDRESS> src/MyContract.sol:MyContract \
  --verifier etherscan \
  --verifier-url "https://api.etherscan.io/v2/api?chainid=167000" \
  --etherscan-api-key $ETHERSCAN_API_KEY --watch
```

## Testing on Taiko

```bash
# Fork Taiko mainnet for testing
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz

# Run specific test with fork
FOUNDRY_PROFILE=layer2 forge test --match-test testBridgeInteraction --fork-url https://rpc.mainnet.taiko.xyz -vvv

# Gas report
FOUNDRY_PROFILE=layer2 forge test --gas-report --fork-url https://rpc.mainnet.taiko.xyz
```

## Bridging Assets

To deploy contracts, you need ETH on Taiko Alethia:

1. **Get ETH on Ethereum Mainnet** - Purchase from an exchange or use an existing wallet
2. **Bridge to Taiko Alethia** - https://bridge.taiko.xyz

**Note:** Bridging back to L1 takes up to 24 hours due to the cooldown period.

## Cast CLI Commands

```bash
# Check ETH balance
cast balance <ADDRESS> --rpc-url https://rpc.mainnet.taiko.xyz

# Get chain ID
cast chain-id --rpc-url https://rpc.mainnet.taiko.xyz

# Get block number
cast block-number --rpc-url https://rpc.mainnet.taiko.xyz

# Get gas price
cast gas-price --rpc-url https://rpc.mainnet.taiko.xyz

# Send transaction
cast send <TO> "functionName(args)" --rpc-url https://rpc.mainnet.taiko.xyz --private-key $PRIVATE_KEY
```

## Examples

See `examples/` directory for:
- **Python**: Block hash calculation, signal verification
- **Solidity**: Bridge receiver, cross-chain contracts

## Useful Tools

- **Code Diff**: https://codediff.taiko.xyz - Compare contract implementations
- **Status Page**: https://status.taiko.xyz - Network status
- **Proof Dashboard**: https://proofs.taiko.xyz - ZK proof coverage

## x402 Payments

Taiko runs [x402](https://www.x402.org) facilitators for HTTP-native payments. Both use scheme `exact`, x402 version `2`, and expose endpoints: `POST /verify`, `POST /settle`, `GET /supported`.

### facilitator.taiko.xyz (Hoodi + Mainnet)

| Property | Value |
|----------|-------|
| URL | `https://facilitator.taiko.xyz` |
| Networks | `eip155:167013` (Hoodi), `eip155:167000` (Mainnet) |
| Signer (Hoodi) | `0x81062a8b93fc840225bf879829145e3840057CD4` |
| Signer (Mainnet) | `0x368F2B55172DFABcEa49A88508237B73C78Ed2f2` |

### x402.taiko.xyz (Mainnet only)

| Property | Value |
|----------|-------|
| URL | `https://x402.taiko.xyz` |
| Network | `eip155:167000` (Mainnet) |
| Signer | `0x2A67c750b770878196d258cEc987Bd530caFfBf7` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid EVM version" | Use `FOUNDRY_PROFILE=layer2` |
| "Contract not verified" | Check API endpoint URL and key |
| "Insufficient funds" | Bridge ETH from L1 Ethereum |
| "Transaction reverted" | Use `cast run <TX_HASH>` to debug |
| Build fails with PUSH0 | Ensure using Shanghai EVM |

## Protocol Source

- Latest releases: https://github.com/taikoxyz/taiko-mono/releases?q=alethia-protocol
- Protocol source: https://github.com/taikoxyz/taiko-mono/tree/main/packages/protocol
