# Foundry Guide for Taiko

Extended reference for Foundry development on Taiko. For quick commands, see the main skill file.

## Cast Encoding/Decoding

```bash
cast calldata "transfer(address,uint256)" 0x123... 1000000  # Encode function call
cast 4byte-decode 0xa9059cbb000000...                       # Decode calldata
cast abi-encode "constructor(string,uint256)" "Name" 1000   # Constructor args
```

## Environment Setup

```bash
# .env template
PRIVATE_KEY=            # Without 0x prefix
TAIKO_RPC=https://rpc.hoodi.taiko.xyz
ETHERSCAN_API_KEY=      # For verification

# Load: source .env
```

## Named Endpoints (foundry.toml)

```toml
[rpc_endpoints]
taiko-hoodi = "https://rpc.hoodi.taiko.xyz"
ethereum-hoodi = "${HOODI_RPC_URL}"

[etherscan]
taiko-hoodi = { key = "${ETHERSCAN_API_KEY}", url = "https://api.etherscan.io/v2/api?chainid=167013" }
```

Then use: `forge script ... --rpc-url taiko-hoodi --verify`

## Debugging Commands

```bash
cast run <TX_HASH> --rpc-url https://rpc.hoodi.taiko.xyz    # Trace failed tx
cast estimate <TO> "fn()" --rpc-url https://rpc.hoodi.taiko.xyz  # Estimate gas
cast storage <CONTRACT> <SLOT> --rpc-url https://rpc.hoodi.taiko.xyz  # Read storage
```

## Testing Matrix

| Test Type | Command |
|-----------|---------|
| Unit | `FOUNDRY_PROFILE=layer2 forge test -vvv` |
| Fork | `... forge test --fork-url https://rpc.hoodi.taiko.xyz` |
| Fuzz | `... forge test --fuzz-runs 1000` |
| Coverage | `... forge coverage --fork-url ...` |
| Gas report | `... forge test --gas-report` |

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Invalid EVM version | Prague bytecode | Use `FOUNDRY_PROFILE=layer2` |
| Verification fails | Wrong API/args | Check URL, use `--constructor-args $(cast abi-encode ...)` |
| Tx reverted | Logic error | `cast run <TX_HASH>` to trace |
| Insufficient funds | No L2 ETH | Faucet → Bridge to L2 |
