# Solidity Examples

Cross-chain messaging examples. See `../../assets/foundry-template/` for project setup.

## BridgeReceiver.sol

Receive cross-chain messages from L1 with replay protection.

```solidity
BridgeReceiver receiver = new BridgeReceiver();
// L1 sends message via Bridge → calls onMessageReceived()
```

## CrossChainCounter.sol

Bidirectional counter with state sync.

```bash
# Deploy factory
FOUNDRY_PROFILE=layer2 forge create src/CrossChainCounter.sol:CrossChainCounterFactory \
  --rpc-url https://rpc.hoodi.taiko.xyz --private-key $PRIVATE_KEY

# Increment and sync
cast send $COUNTER "increment()" --rpc-url ... --private-key $PRIVATE_KEY
cast send $COUNTER "syncToRemote(uint32)" 200000 --value 0.001ether --rpc-url ... --private-key $PRIVATE_KEY
```

## Chain Config

| Chain | ID | Bridge |
|-------|------|--------|
| Hoodi L1 | 560048 | `0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80` |
| Taiko L2 | 167013 | `0x1670130000000000000000000000000000000001` |

## Notes

- Always use `FOUNDRY_PROFILE=layer2` for Taiko L2
- L2→L1 messages require merkle proof after finalization
- Bridge fees paid via `msg.value`
