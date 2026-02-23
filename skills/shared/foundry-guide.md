# Foundry Guide for Taiko

Configuration and commands for developing on Taiko using Foundry.

## EVM Version Configuration

**Critical:** Taiko L2 uses Shanghai EVM. Configure Foundry with profiles:

```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.30"
evm_version = "prague"
optimizer = true
optimizer_runs = 200

# Use FOUNDRY_PROFILE=layer2 for Taiko L2
[profile.layer2]
evm_version = "shanghai"

[fmt]
line_length = 100
tab_width = 4
bracket_spacing = true

[fuzz]
runs = 200

[invariant]
runs = 256
depth = 15
```

## Build Commands

```bash
# Build for L1 (default profile)
forge build

# Build for Taiko L2 (Shanghai EVM)
FOUNDRY_PROFILE=layer2 forge build

# Clean and rebuild
forge clean && FOUNDRY_PROFILE=layer2 forge build
```

## Deployment Commands

### Basic Deployment

```bash
# Deploy to Taiko
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

## Verification Commands

### Taikoscan (Etherscan-style)

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

### With Constructor Args

```bash
forge verify-contract <CONTRACT_ADDRESS> src/Token.sol:Token \
  --verifier-url https://api-hoodi.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(string,string,uint256)" "TokenName" "TKN" 1000000000000000000000000)
```

## Testing

### Local Tests

```bash
# Run tests with layer2 profile
FOUNDRY_PROFILE=layer2 forge test

# With verbosity
FOUNDRY_PROFILE=layer2 forge test -vvv

# Specific test
FOUNDRY_PROFILE=layer2 forge test --match-test testMyFunction -vvv
```

### Fork Testing

```bash
# Fork Taiko testnet
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz

# Fork at specific block
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz --fork-block-number 1000000
```

### Coverage

```bash
FOUNDRY_PROFILE=layer2 forge coverage --fork-url https://rpc.hoodi.taiko.xyz
```

### Gas Reports

```bash
FOUNDRY_PROFILE=layer2 forge test --gas-report
```

## Cast CLI Commands

### Reading Data

```bash
# Check ETH balance
cast balance <ADDRESS> --rpc-url https://rpc.hoodi.taiko.xyz

# Get chain ID
cast chain-id --rpc-url https://rpc.hoodi.taiko.xyz

# Get block number
cast block-number --rpc-url https://rpc.hoodi.taiko.xyz

# Get gas price
cast gas-price --rpc-url https://rpc.hoodi.taiko.xyz

# Get block info
cast block latest --rpc-url https://rpc.hoodi.taiko.xyz

# Read contract storage
cast storage <CONTRACT> <SLOT> --rpc-url https://rpc.hoodi.taiko.xyz

# Call view function
cast call <CONTRACT> "balanceOf(address)" <ADDRESS> --rpc-url https://rpc.hoodi.taiko.xyz
```

### Writing Data

```bash
# Send transaction
cast send <TO> "functionName(uint256)" 123 \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY

# Send ETH
cast send <TO> --value 0.1ether \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### Encoding/Decoding

```bash
# Encode function call
cast calldata "transfer(address,uint256)" 0x123... 1000000

# Decode calldata
cast 4byte-decode 0xa9059cbb000000...

# ABI encode constructor args
cast abi-encode "constructor(string,uint256)" "Name" 1000
```

## Environment Setup

### .env File

```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=

# RPC URLs
TAIKO_RPC=https://rpc.hoodi.taiko.xyz
HOODI_RPC_URL=

# API Keys for verification
TAIKOSCAN_API_KEY=
ETHERSCAN_API_KEY=
```

### Loading Environment

```bash
source .env
# or
export $(cat .env | xargs)
```

## Common Issues

### 1. "Invalid EVM version"

**Problem:** Contract uses Cancun/Prague features.

**Solution:** Use layer2 profile:
```bash
FOUNDRY_PROFILE=layer2 forge build
```

### 2. "Contract not verified"

**Problem:** Verification fails.

**Solutions:**
- Check API endpoint URL
- Ensure compiler version matches
- Verify constructor args encoding
- Wait for block confirmation

### 3. "Transaction reverted"

**Problem:** Deployment or call fails.

**Solutions:**
```bash
# Debug with trace
cast run <TX_HASH> --rpc-url https://rpc.hoodi.taiko.xyz

# Check gas estimation
cast estimate <TO> "function()" --rpc-url https://rpc.hoodi.taiko.xyz
```

### 4. "Insufficient funds"

**Problem:** Not enough ETH for deployment.

**Solution:** Get test ETH:
1. Get Hoodi ETH from faucets
2. Bridge to Taiko via https://bridge.hoodi.taiko.xyz

## RPC Endpoint Configuration

```toml
# foundry.toml
[rpc_endpoints]
taiko-hoodi = "https://rpc.hoodi.taiko.xyz"
ethereum-hoodi = "${HOODI_RPC_URL}"

[etherscan]
taiko-hoodi = { key = "${TAIKOSCAN_API_KEY}", url = "https://api-hoodi.taikoscan.io/api", chain = 167013 }
```

Then use named endpoints:

```bash
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol \
  --rpc-url taiko-hoodi \
  --broadcast \
  --verify
```
