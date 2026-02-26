# Solidity Examples

Cross-chain messaging examples for Taiko networks. See `../../assets/foundry-template/` for project setup.

## BridgeReceiver.sol

Receive cross-chain messages from L1 with replay protection. Auto-detects network.

```solidity
BridgeReceiver receiver = new BridgeReceiver();
// L1 sends message via Bridge -> calls onMessageReceived()
```

## HelloTaikoCrossChain.sol

Bidirectional counter with state sync. Auto-detects bridge address from chain ID.

```bash
# Deploy factory (auto-selects correct bridge)
FOUNDRY_PROFILE=layer2 forge create src/HelloTaikoCrossChain.sol:HelloTaikoCrossChainFactory \
  --rpc-url $TAIKO_RPC --private-key $PRIVATE_KEY
```

## Supported Networks

| Chain | ID | L2 Bridge | L1 Bridge |
|-------|------|-----------|-----------|
| Taiko Mainnet | 167000 | `0x1670000...0001` | `0xd60247...d8EC` |
| Taiko Hoodi | 167013 | `0x1670130...0001` | `0x6a4cf6...Ed80` |

## Notes

- Always use `FOUNDRY_PROFILE=layer2` for Taiko L2
- L2->L1 messages require merkle proof after finalization
- Bridge fees paid via `msg.value`
