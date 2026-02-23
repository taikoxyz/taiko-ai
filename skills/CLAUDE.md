# Taiko AI Skills

This directory contains AI-assisted development skills for Taiko networks.

## Available Skills

### taiko-hoodi

Deploy, test, and interact with smart contracts on Taiko Hoodi testnet.

**Use when:** User mentions "Taiko testnet", "Taiko Hoodi", "hoodi", or "testnet deployment"

**Location:** [taiko-hoodi/SKILL.md](taiko-hoodi/SKILL.md)

**Capabilities:**
- Smart contract deployment with Foundry
- Cross-chain messaging via Bridge
- Fork testing against live Taiko state
- Contract verification on Taikoscan/Blockscout

## Shared Knowledge

Common protocol knowledge used across all Taiko network skills:

| Document | Description |
|----------|-------------|
| [protocol-overview.md](shared/protocol-overview.md) | Based rollup architecture and components |
| [bridge-interface.md](shared/bridge-interface.md) | IBridge interface for cross-chain messaging |
| [anchor-contract.md](shared/anchor-contract.md) | Accessing L1 data from L2 |
| [evm-compatibility.md](shared/evm-compatibility.md) | Type-1 ZK-EVM and Shanghai EVM |
| [security-checklist.md](shared/security-checklist.md) | Pre-deployment security checks |
| [foundry-guide.md](shared/foundry-guide.md) | Foundry configuration for L2 |
| [cross-chain-patterns.md](shared/cross-chain-patterns.md) | L1↔L2 messaging patterns |

## Quick Reference

### EVM Version

Taiko L2 uses **Shanghai EVM**. Always use the layer2 profile:

```bash
FOUNDRY_PROFILE=layer2 forge build
FOUNDRY_PROFILE=layer2 forge test
FOUNDRY_PROFILE=layer2 forge script ...
```

### Network Details

| Network | Chain ID | RPC |
|---------|----------|-----|
| Taiko Hoodi (L2) | 167013 | https://rpc.hoodi.taiko.xyz |
| Hoodi (L1) | 560048 | https://hoodi.drpc.org |

### Key Addresses (Taiko Hoodi L2)

| Contract | Address |
|----------|---------|
| Bridge | `0x1670130000000000000000000000000000000001` |
| SignalService | `0x1670130000000000000000000000000000000005` |
| TaikoL2 | `0x1670130000000000000000000000000000010001` |

## Usage Pattern

When a user requests help with Taiko:

1. **Identify the network** - Hoodi (testnet) or Mainnet
2. **Load the appropriate skill** - Read the network's SKILL.md
3. **Reference shared docs** - Use shared/ for protocol knowledge
4. **Use provided templates** - Copy from assets/ for new projects
5. **Follow examples** - Reference examples/ for implementation patterns

## Adding New Network Skills

To add support for a new Taiko network (e.g., mainnet):

1. Create `skills/taiko-mainnet/` directory structure
2. Copy structure from `taiko-hoodi/`
3. Update addresses and configuration for the new network
4. Reference the same `shared/` documents

The shared knowledge in `shared/` applies to all Taiko networks.
