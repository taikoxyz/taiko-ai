# EVM Compatibility

Taiko is a **Type-1 ZK-EVM**, designed for full Ethereum equivalence.

## Type-1 ZK-EVM

Type-1 means:
- **Fully Ethereum-equivalent** at the protocol level
- Same opcodes, precompiles, and gas costs as Ethereum
- Existing Ethereum contracts deploy without modification
- Standard Ethereum tooling works (Foundry, Hardhat, etc.)

## Shanghai Fork Support

Taiko currently supports **Shanghai fork** EVM:

### Supported Features

| EIP | Feature |
|-----|---------|
| EIP-3651 | Warm COINBASE |
| EIP-3855 | PUSH0 instruction |
| EIP-3860 | Limit and meter initcode |
| EIP-4895 | Beacon chain push withdrawals |
| All pre-Shanghai | Full support |

### Not Yet Supported

| Feature | Status |
|---------|--------|
| EIP-4844 | Blob transactions (on L2) |
| Dencun upgrades | Not yet |
| Post-Shanghai EIPs | Not yet |

## Foundry Configuration

**Critical:** When compiling contracts for Taiko L2, use Shanghai EVM:

```toml
# foundry.toml
[profile.default]
solc_version = "0.8.30"
evm_version = "prague"  # For L1

[profile.layer2]
evm_version = "shanghai"  # For Taiko L2
```

```bash
# Always use layer2 profile for Taiko
FOUNDRY_PROFILE=layer2 forge build
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz
```

## Block Header Differences

Taiko L2 block headers are Ethereum-compatible with some variations:

### Standard Fields (Preserved)

```
parentHash, stateRoot, transactionsRoot, receiptsRoot,
logsBloom, difficulty (always 0), number, gasLimit,
gasUsed, timestamp, extraData, baseFeePerGas
```

### L2-Specific Considerations

| Field | Notes |
|-------|-------|
| `mixHash` | May contain L1 anchor data |
| `nonce` | Always 0 |
| `withdrawalsRoot` | Present but may differ from L1 behavior |
| `difficulty` | Always 0 (PoS) |

## Gas Configuration

| Parameter | Taiko | Ethereum |
|-----------|-------|----------|
| Block Gas Limit | 241,000,000 | 36,000,000 |
| Block Gas Target | 40,000,000 (per L1 block) | 18,000,000 |
| Block Time | ~2-6 seconds | 12 seconds |

### Gas Pricing

```
L2 Gas Price = Base Fee (EIP-1559 style)
             + Priority Fee (optional)

Base Fee adjusts based on:
- Gas target per L1 block (40M)
- Actual gas used
- Standard EIP-1559 algorithm
```

## Precompiles

All Ethereum precompiles are supported:

| Address | Precompile |
|---------|------------|
| 0x01 | ecRecover |
| 0x02 | SHA256 |
| 0x03 | RIPEMD160 |
| 0x04 | identity |
| 0x05 | modexp |
| 0x06 | ecAdd |
| 0x07 | ecMul |
| 0x08 | ecPairing |
| 0x09 | blake2f |

## Opcodes

All Shanghai opcodes are supported, including:

| Opcode | Description |
|--------|-------------|
| `PUSH0` | Push zero to stack (gas efficient) |
| `BASEFEE` | Get current base fee |
| `CHAINID` | Returns Taiko chain ID |
| `SELFBALANCE` | Get contract balance |
| `COINBASE` | Block proposer address |

## Common Compatibility Issues

### 1. EVM Version Mismatch

**Problem:** Contract compiled with Cancun/Prague features fails on Taiko.

**Solution:** Use Shanghai EVM version:
```bash
FOUNDRY_PROFILE=layer2 forge build
```

### 2. BLOCKHASH Behavior

**Note:** `blockhash()` returns values for last 256 blocks. For older blocks, use the Anchor contract's `blockHashes` mapping.

### 3. Block Time Assumptions

**Problem:** Hardcoded 12-second block time assumptions.

**Solution:** Taiko blocks are 2-6 seconds. Use `block.timestamp` for time-based logic, not block numbers.

### 4. Gas Limit Differences

**Note:** Taiko has higher gas limits (241M vs 36M). Contracts assuming lower limits should work fine, but gas estimation may differ.

## Verification

To verify EVM compatibility:

```bash
# Check chain ID
cast chain-id --rpc-url https://rpc.hoodi.taiko.xyz

# Check block info
cast block latest --rpc-url https://rpc.hoodi.taiko.xyz

# Verify contract bytecode matches
cast code <address> --rpc-url https://rpc.hoodi.taiko.xyz
```
