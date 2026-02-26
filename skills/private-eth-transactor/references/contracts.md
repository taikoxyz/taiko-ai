# Shadow Deployed Contracts

## Taiko Hoodi Testnet (Chain ID: 167013)

| Contract | Address |
|----------|---------|
| Shadow (proxy) | `0x77cdA0575e66A5FC95404fdA856615AD507d8A07` |
| ShadowVerifier | `0x41B15F5Ed8339122231f16eF4f260B08CCB9C726` |
| Risc0CircuitVerifier | `0x6E84a9749B9887C3e80b40a1fBB976888dD1f00D` |
| RiscZeroGroth16Verifier | `0xd1934807041B168f383870A0d8F565aDe2DF9D7D` |
| DummyEtherMinter (testnet) | `0x6DC226aA43E86fE77735443fB50a0A90e5666AA4` |

**Circuit ID (imageId):** `0x6ca03c648024c754d607fdb67ed03e60f426b1286e6f2f64141a4841fccd5d7a`

> Note: `DummyEtherMinter` emits `EthMinted(to, amount)` events but does not mint real ETH. On mainnet this is replaced by the Taiko protocol's `IEthMinter`.

## Taiko Mainnet (Chain ID: 167000)

Contracts not yet deployed. Check https://github.com/taikoxyz/shadow/blob/main/DEPLOYMENT.md for updates.

## Useful Cast Queries

```bash
# Check if a nullifier has been consumed (note already claimed)
cast call 0x77cdA0575e66A5FC95404fdA856615AD507d8A07 \
  "isConsumed(bytes32)(bool)" \
  <nullifier_hex> \
  --rpc-url https://rpc.hoodi.taiko.xyz

# Get server config (includes live contract addresses)
curl http://localhost:3000/api/config
```

## L1 Contract (CheckpointStore)

The `ICheckpointStore` that Shadow's verifier queries is the Taiko Anchor contract on L2, which syncs L1 state roots:

```
Anchor contract: 0x1670130000000000000000000000000000010001  (Taiko L2)
```

Shadow's `ShadowVerifier` calls `ICheckpointStore.getCheckpoint(blockNumber)` to fetch the `stateRoot` used in ZK proof verification — it is never user-supplied calldata.
