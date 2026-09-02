# EVM Compatibility

Taiko is a **Type-1 ZK-EVM** - fully Ethereum-equivalent at the protocol level.

## Osaka Fork

Taiko and Ethereum are both on **Osaka** (the execution-layer half of Ethereum's Fusaka
upgrade), so contracts compile and behave identically on L1 and L2. No opcode is available on
one chain but missing on the other.

| Supported | Status |
|-----------|--------|
| EIP-3651 COINBASE / EIP-3855 PUSH0 / EIP-3860 initcode limit (Shanghai) | ✓ |
| EIP-1153 TSTORE / TLOAD, EIP-5656 MCOPY (Cancun) | ✓ |
| EIP-4844 BLOBHASH, EIP-7516 BLOBBASEFEE (Cancun) | ✓ |
| EIP-7702 delegated EOAs (Prague) | ✓ |
| EIP-7939 CLZ (Osaka) | ✓ |
| All pre-Osaka | ✓ |

The two chains can fork independently again, so keep the `layer2` profile below rather than
compiling Taiko contracts with the inherited L1 default — it is the one line to change if L2
ever lags L1 through a future fork.

## Foundry Config

```toml
[profile.default]
evm_version = "osaka"   # Ethereum L1

[profile.layer2]
evm_version = "osaka"   # Taiko L2 — pinned explicitly so L2 can lag L1 again
```

```bash
FOUNDRY_PROFILE=layer2 forge build
```

Requires solc ≥ 0.8.30 (`evm_version = "osaka"` is rejected by older compilers).

## Block Differences

| Parameter | Taiko | Ethereum |
|-----------|-------|----------|
| Gas Limit | 46M | ~60M (validator-set) |
| Block Time | 2-6s | 12s |
| Difficulty | 0 (PoS) | 0 (PoS) |

Gas limit is the practical difference to design around, not the instruction set.

## Gas

```
Base Fee = EIP-1559 style, targets 40M gas per L1 block
```

## Precompiles

`0x01-0x0A`: ecRecover, SHA256, RIPEMD160, identity, modexp, ecAdd, ecMul, ecPairing,
blake2f, point evaluation (EIP-4844).

`0x0B-0x11`: BLS12-381 G1/G2 add, MSM, pairing check, and field-to-curve maps (EIP-2537,
added in Prague).

## Common Issues

| Issue | Fix |
|-------|-----|
| "Invalid EVM version" from forge | Upgrade solc to ≥ 0.8.30 — `osaka` is unknown to older versions |
| Block time assumptions | Use `block.timestamp`, not block numbers |
| Old blockhash | Use Anchor's `blockHashes` for >256 blocks |
