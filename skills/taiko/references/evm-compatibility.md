# EVM Compatibility

Taiko is a **Type-1 ZK-EVM** - fully Ethereum-equivalent at the protocol level.

## Shanghai Fork

Taiko supports Shanghai EVM. Not yet supported: EIP-4844 blobs, Dencun/Cancun upgrades.

| Supported | Status |
|-----------|--------|
| EIP-3651 COINBASE | ✓ |
| EIP-3855 PUSH0 | ✓ |
| EIP-3860 Initcode limit | ✓ |
| All pre-Shanghai | ✓ |
| Post-Shanghai EIPs | ✗ |

## Foundry Config

```toml
[profile.layer2]
evm_version = "shanghai"
```

```bash
FOUNDRY_PROFILE=layer2 forge build
```

## Block Differences

| Parameter | Taiko | Ethereum |
|-----------|-------|----------|
| Gas Limit | 241M | 36M |
| Block Time | 2-6s | 12s |
| Difficulty | 0 (PoS) | 0 (PoS) |

## Gas

```
Base Fee = EIP-1559 style, targets 40M gas per L1 block
```

## Precompiles

All standard (0x01-0x09): ecRecover, SHA256, RIPEMD160, identity, modexp, ecAdd, ecMul, ecPairing, blake2f

## Common Issues

| Issue | Fix |
|-------|-----|
| Cancun/Prague bytecode | Use `evm_version = "shanghai"` |
| Block time assumptions | Use `block.timestamp`, not block numbers |
| Old blockhash | Use Anchor's `blockHashes` for >256 blocks |
