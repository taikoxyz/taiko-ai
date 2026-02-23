# Solidity Examples for Taiko Hoodi

Cross-chain messaging examples for Taiko Hoodi.

## Setup

These examples require Foundry. See the [foundry-template](../../assets/foundry-template/) for a complete project setup.

```bash
# Copy the template
cp -r ../../assets/foundry-template ./my-project
cd my-project

# Copy examples into src/
cp ../solidity/*.sol src/

# Build (always use layer2 profile for Taiko L2)
FOUNDRY_PROFILE=layer2 forge build
```

## Examples

### BridgeReceiver.sol

Demonstrates receiving cross-chain messages from L1.

**Features:**
- Receive messages from the Taiko Bridge
- Replay protection with message hash tracking
- ETH value handling
- Extensible message processing

**Contracts:**
- `BridgeReceiver` - Base contract for receiving bridge messages
- `WhitelistReceiver` - Example: Whitelist addresses from L1

**Usage:**
```solidity
// Deploy on L2
BridgeReceiver receiver = new BridgeReceiver();

// From L1, send a message to this contract via the Bridge
// The bridge will call onMessageReceived() with your data
```

### CrossChainCounter.sol

Demonstrates bidirectional cross-chain state synchronization.

**Features:**
- Send messages from L2 to L1
- Receive messages from L1 on L2
- Maintain synchronized counter state
- Factory for automatic bridge address selection

**Contracts:**
- `CrossChainCounter` - Bidirectional counter with sync
- `CrossChainCounterFactory` - Deploys with correct bridge address

**Deployment:**
```bash
# Deploy on L2 (Taiko Hoodi)
FOUNDRY_PROFILE=layer2 forge create src/CrossChainCounter.sol:CrossChainCounterFactory \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY

# Call deploy() to create a counter
cast send $FACTORY_ADDRESS "deploy()" \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

**Syncing State:**
```bash
# Increment counter locally
cast send $COUNTER_ADDRESS "increment()" \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY

# Sync to remote chain (requires ETH for bridge fee)
cast send $COUNTER_ADDRESS "syncToRemote(uint32)" 200000 \
  --value 0.001ether \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

## Chain Configuration

| Chain | Chain ID | Bridge Address |
|-------|----------|----------------|
| Hoodi (L1) | 560048 | `0x99C73fAc2F015c18CE89b87b98Ee0d8bEBBB9c67` |
| Taiko Hoodi (L2) | 167013 | `0x1670130000000000000000000000000000000001` |

## Important Notes

### EVM Version

Always use `FOUNDRY_PROFILE=layer2` when building for Taiko L2:

```bash
# Correct - uses Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Wrong - uses Prague EVM (not supported)
forge build
```

### Bridge Message Flow

1. **L1 → L2**: Messages are included in L1 blocks and processed by Taiko provers
2. **L2 → L1**: Messages require merkle proof verification after block finalization

### Gas Considerations

- L2 → L1 messages require a `gasLimit` parameter for execution on L1
- Bridge fees are paid in ETH via `msg.value`
- Use `estimateSyncFee()` as a starting point for fee estimation

## Testing

```bash
# Unit tests
FOUNDRY_PROFILE=layer2 forge test

# Fork tests against live Taiko state
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz -vvv
```

## Resources

- [Taiko Bridge Documentation](https://docs.taiko.xyz/core-concepts/bridging)
- [SignalService](../../../shared/cross-chain-patterns.md)
- [Bridge Interface](../../../shared/bridge-interface.md)
