# Taiko Mainnet Foundry Template

A ready-to-use Foundry project for deploying smart contracts on Taiko Alethia (mainnet).

## Quick Start

```bash
# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.0.0

# Copy environment file
cp .env.example .env
# Edit .env with your private key

# Build (use layer2 profile for Taiko)
FOUNDRY_PROFILE=layer2 forge build

# Test
FOUNDRY_PROFILE=layer2 forge test

# Deploy
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployCounter \
  --rpc-url https://rpc.mainnet.taiko.xyz \
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
│   ├── Counter.sol                # Example contract
│   └── TaikoMainnetAddresses.sol  # Protocol address constants
├── script/
│   └── Deploy.s.sol               # Deployment scripts
├── test/
│   └── Counter.t.sol              # Tests including fork tests
├── foundry.toml                   # Foundry configuration
├── remappings.txt                 # Import remappings for OpenZeppelin
└── .env.example                   # Environment template
```

## Using OpenZeppelin

This template is pre-configured for OpenZeppelin v5. Import contracts with:

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
```

For upgradeable contracts:

```solidity
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
```

**Important:** Never use `forge update` without specifying a version tag, as it defaults to the unstable master branch.

## Deploying Contracts

### Using forge create

```bash
FOUNDRY_PROFILE=layer2 forge create src/Counter.sol:Counter \
  --rpc-url https://rpc.mainnet.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### Using Scripts

```bash
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployCounter \
  --rpc-url https://rpc.mainnet.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## Verifying Contracts

### Taikoscan

```bash
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --verifier-url https://api.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY
```

### Blockscout

```bash
forge verify-contract <ADDRESS> src/Counter.sol:Counter \
  --chain-id 167000 \
  --verifier blockscout \
  --verifier-url "https://blockscoutapi.mainnet.taiko.xyz/api?"
```

## Fork Testing

Test against live Taiko state:

```bash
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz -vvv
```

## Using Protocol Addresses

Import `TaikoMainnetAddresses` for protocol contract addresses:

```solidity
import {TaikoMainnetAddresses} from "./TaikoMainnetAddresses.sol";

contract MyContract {
    function getBridge() external pure returns (address) {
        return TaikoMainnetAddresses.L2_BRIDGE;
    }
}
```

## Getting ETH

1. Acquire ETH on Ethereum Mainnet
2. Bridge to Taiko via https://bridge.taiko.xyz

## Resources

- [Taiko Docs](https://docs.taiko.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [Block Explorer](https://taikoscan.io)
