# Solidity Examples

Cross-chain messaging examples. See `../../assets/foundry-template/` for project setup.

## BridgeReceiver.sol

Receive cross-chain messages from L1 with replay protection.

```solidity
BridgeReceiver receiver = new BridgeReceiver();
// L1 sends message via Bridge -> calls onMessageReceived()
```

## CrossChainCounter.sol

Bidirectional counter with state sync.

```bash
# Deploy factory
FOUNDRY_PROFILE=layer2 forge create src/CrossChainCounter.sol:CrossChainCounterFactory \
  --rpc-url https://rpc.mainnet.taiko.xyz --private-key $PRIVATE_KEY

# Increment and sync
cast send $COUNTER "increment()" --rpc-url ... --private-key $PRIVATE_KEY
cast send $COUNTER "syncToRemote(uint32)" 200000 --value 0.001ether --rpc-url ... --private-key $PRIVATE_KEY
```

## Chain Config

| Chain | ID | Bridge |
|-------|------|--------|
| Ethereum L1 | 1 | `0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC` |
| Taiko L2 | 167000 | `0x1670000000000000000000000000000000000001` |

## Notes

- Always use `FOUNDRY_PROFILE=layer2` for Taiko L2
- L2->L1 messages require merkle proof after finalization
- Bridge fees paid via `msg.value`
