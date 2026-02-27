# Shadow Deployed Contracts

## Taiko Hoodi Testnet (Chain ID: 167013)

| Contract | Address |
|----------|---------|
| Shadow (proxy) | `0x77cdA0575e66A5FC95404fdA856615AD507d8A07` |
| Shadow (implementation) | `0xa98866f5427f1592Cf747024eA970bFDf67A2d2A` |
| ShadowVerifier | `0xA3291dF14D09f71151a0a0b2E732DC26be21CDcD` |
| Risc0CircuitVerifier | `0x9A4D9720E9ec87b7C9E5f5F8Fb1b083B4D6e5b29` |
| RiscZeroGroth16Verifier | `0xd1934807041B168f383870A0d8F565aDe2DF9D7D` |
| DummyEtherMinter (testnet) | `0x6DC226aA43E86fE77735443fB50a0A90e5666AA4` |

**Circuit ID (imageId):** `0xac4b31fadeb0115a1e6019c8bccc0ddf900fe6e40a447409d9ce6b257913dcbc`

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
curl http://localhost:$SHADOW_PORT/api/config
```

## L1 Contract (CheckpointStore)

The `ICheckpointStore` that Shadow's verifier queries is the Taiko Anchor contract on L2, which syncs L1 state roots:

```
Anchor contract: 0x1670130000000000000000000000000000010001  (Taiko L2)
```

Shadow's `ShadowVerifier` calls `ICheckpointStore.getCheckpoint(blockNumber)` to fetch the `stateRoot` used in ZK proof verification — it is never user-supplied calldata.
