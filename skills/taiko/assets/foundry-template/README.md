# Taiko Foundry Template

A ready-to-use Foundry project for deploying smart contracts on Taiko networks (mainnet and testnet).

## Quick Start

```bash
# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.0.0

# Copy environment file
cp .env.example .env
# Edit .env with your private key and target RPC

# Build (use layer2 profile for Taiko)
FOUNDRY_PROFILE=layer2 forge build

# Test
FOUNDRY_PROFILE=layer2 forge test

# Deploy
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployHelloTaiko \
  --rpc-url $TAIKO_RPC --private-key $PRIVATE_KEY --broadcast
```

## Important: EVM Version

Taiko uses **Shanghai EVM**. Always use `FOUNDRY_PROFILE=layer2`.

## Project Structure

```
├── src/
│   ├── HelloTaiko.sol         # Example Taiko-aware contract
│   ├── HoodiAddresses.sol     # Hoodi testnet protocol addresses
│   └── MainnetAddresses.sol   # Mainnet protocol addresses
├── script/
│   └── Deploy.s.sol           # Deployment scripts
├── test/
│   └── HelloTaiko.t.sol       # Tests including fork tests
├── foundry.toml               # Foundry config (both networks)
└── .env.example               # Environment template
```

## Using Protocol Addresses

```solidity
import {HoodiAddresses} from "./HoodiAddresses.sol";
import {MainnetAddresses} from "./MainnetAddresses.sol";

contract MyContract {
    function getBridge() external view returns (address) {
        if (block.chainid == 167000) return MainnetAddresses.L2_BRIDGE;
        return HoodiAddresses.L2_BRIDGE;
    }
}
```

## Deploying

```bash
# Hoodi testnet
FOUNDRY_PROFILE=layer2 forge create src/HelloTaiko.sol:HelloTaiko \
  --rpc-url https://rpc.hoodi.taiko.xyz --private-key $PRIVATE_KEY

# Mainnet
FOUNDRY_PROFILE=layer2 forge create src/HelloTaiko.sol:HelloTaiko \
  --rpc-url https://rpc.mainnet.taiko.xyz --private-key $PRIVATE_KEY
```

## Verifying

```bash
# Taikoscan (mainnet)
forge verify-contract <ADDRESS> src/HelloTaiko.sol:HelloTaiko \
  --verifier-url https://api.taikoscan.io/api --etherscan-api-key $TAIKOSCAN_API_KEY

# Taikoscan (hoodi)
forge verify-contract <ADDRESS> src/HelloTaiko.sol:HelloTaiko \
  --verifier-url https://api-hoodi.taikoscan.io/api --etherscan-api-key $TAIKOSCAN_API_KEY

# Blockscout (mainnet)
forge verify-contract <ADDRESS> src/HelloTaiko.sol:HelloTaiko \
  --chain-id 167000 --verifier blockscout \
  --verifier-url "https://blockscoutapi.mainnet.taiko.xyz/api?"
```

## Fork Testing

```bash
# Against hoodi
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz -vvv

# Against mainnet
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz -vvv
```

## Using OpenZeppelin

Pre-configured for OpenZeppelin v5:

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
```

**Important:** Never use `forge update` without specifying a version tag.

## Getting ETH

- **Mainnet:** Bridge from Ethereum via https://bridge.taiko.xyz
- **Hoodi:** Get test ETH from [faucets](https://cloud.google.com/application/web3/faucet/ethereum/hoodi), bridge via https://bridge.hoodi.taiko.xyz

## Resources

- [Taiko Docs](https://docs.taiko.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [Taikoscan (Mainnet)](https://taikoscan.io)
- [Taikoscan (Hoodi)](https://hoodi.taikoscan.io)
