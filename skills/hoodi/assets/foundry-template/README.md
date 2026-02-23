# Taiko Hoodi Foundry Template

A ready-to-use Foundry project for deploying smart contracts on Taiko Hoodi (testnet).

## Quick Start

```bash
# Install dependencies
forge install

# Copy environment file
cp .env.example .env
# Edit .env with your private key

# Build (use layer2 profile for Taiko)
FOUNDRY_PROFILE=layer2 forge build

# Test
FOUNDRY_PROFILE=layer2 forge test

# Deploy
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployCounter \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Important: EVM Version

Taiko uses **Shanghai EVM**. Always use `FOUNDRY_PROFILE=layer2` when building or deploying to Taiko L2.

```bash
# Correct
FOUNDRY_PROFILE=layer2 forge build

# Wrong - will use Prague EVM
forge build
```

## Project Structure

```
├── src/
│   ├── Counter.sol              # Example contract
│   └── TaikoHoodiAddresses.sol  # Protocol address constants
├── script/
│   └── Deploy.s.sol             # Deployment scripts
├── test/
│   └── Counter.t.sol            # Tests including fork tests
├── foundry.toml                 # Foundry configuration
└── .env.example                 # Environment template
```

## Deploying Contracts

### Using forge create

```bash
FOUNDRY_PROFILE=layer2 forge create src/Counter.sol:Counter \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### Using Scripts

```bash
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployCounter \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Verifying Contracts

### Taikoscan

```bash
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --verifier-url https://api-hoodi.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY
```

### Blockscout

```bash
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --chain-id 167013 \
  --verifier blockscout \
  --verifier-url https://blockscout.hoodi.taiko.xyz/api
```

## Fork Testing

Test against live Taiko state:

```bash
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz -vvv
```

## Using Protocol Addresses

Import `TaikoHoodiAddresses` for protocol contract addresses:

```solidity
import {TaikoHoodiAddresses} from "./TaikoHoodiAddresses.sol";

contract MyContract {
    function getBridge() external pure returns (address) {
        return TaikoHoodiAddresses.L2_BRIDGE;
    }
}
```

## Getting Test ETH

1. Get Hoodi ETH from faucets (see network-config.md)
2. Bridge to Taiko via https://bridge.hoodi.taiko.xyz

## Resources

- [Taiko Docs](https://docs.taiko.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [Block Explorer](https://hoodi.taikoscan.io)
