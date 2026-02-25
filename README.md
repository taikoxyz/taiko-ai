# Taiko AI

A Claude Code plugin for developing on Taiko networks.

## Overview

This plugin provides skills for building, deploying, and testing smart contracts on Taiko - a Type-1 ZK-EVM based rollup on Ethereum.

## Installation

```bash
# Add the Taiko marketplace
/plugin marketplace add taikoxyz/taiko-ai

# Install the plugin
/plugin install taiko@taikoxyz

# Or test locally during development
claude --plugin-dir ./taiko-ai
```

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Hoodi (testnet) | `/taiko:hoodi` | Deploy and test on Taiko Hoodi testnet |
| Mainnet | `/taiko:mainnet` | Deploy to Taiko Alethia mainnet |

### /taiko:hoodi

Deploy, test, and interact with smart contracts on **Taiko Hoodi** (testnet).

**Features:**
- Complete Foundry setup with Shanghai EVM configuration
- Contract deployment and verification guides
- Protocol contract addresses and interfaces
- Python and Solidity examples
- Cross-chain messaging patterns

### /taiko:mainnet

Deploy, test, and interact with smart contracts on **Taiko Alethia** (mainnet).

**Features:**
- Complete Foundry setup with Shanghai EVM configuration
- Contract deployment and verification guides (Taikoscan, Blockscout, Etherscan V2)
- Protocol contract addresses for L1 (Ethereum) and L2 (Taiko)
- Python and Solidity examples
- Cross-chain messaging patterns
- x402 payment facilitator integration

## Plugin Structure

```
taiko-ai/
├── .claude-plugin/
│   └── plugin.json               # Plugin manifest
├── agents/
│   ├── taiko-hoodi-developer.md  # Hoodi testnet subagent
│   └── taiko-mainnet-developer.md # Mainnet subagent
├── skills/
│   ├── hoodi/                    # /taiko:hoodi skill
│   │   ├── SKILL.md              # Main skill file
│   │   ├── references/           # Contract addresses, network config
│   │   ├── examples/             # Python and Solidity examples
│   │   └── assets/               # Foundry template
│   ├── mainnet/                  # /taiko:mainnet skill
│   │   ├── SKILL.md              # Main skill file
│   │   ├── references/           # Contract addresses, network config
│   │   ├── examples/             # Python and Solidity examples
│   │   └── assets/               # Foundry template
│   └── shared/                   # Network-agnostic protocol docs
├── mcp-servers/                  # MCP server implementations (future)
└── README.md
```

## Agents

Two specialized agents provide context-aware assistance:

- **taiko-hoodi-developer** - Testnet development, testing, and experimentation
- **taiko-mainnet-developer** - Production deployment with extra safety checks

Both agents are automatically activated when working on Taiko-related tasks.

## Shared Protocol Knowledge

The `skills/shared/` directory contains network-agnostic documentation used by all network skills:

- **protocol-overview.md** - Taiko architecture, based rollup design
- **bridge-interface.md** - IBridge, SignalService interfaces
- **anchor-contract.md** - Anchor contract usage for L1 data access
- **evm-compatibility.md** - Shanghai EVM, Type-1 ZK-EVM details
- **security-checklist.md** - Smart contract security for Taiko
- **foundry-guide.md** - Foundry configuration for L2 deployment
- **cross-chain-patterns.md** - L1↔L2 messaging patterns

## Quick Reference

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Taiko Alethia | 167000 | https://rpc.mainnet.taiko.xyz | https://taikoscan.io |
| Taiko Hoodi | 167013 | https://rpc.hoodi.taiko.xyz | https://hoodi.taikoscan.io |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) for smart contract development
- Python 3.8+ for Python examples
- [Claude Code](https://claude.ai/code) v1.0.33+ for using plugins

### Using the Foundry Template

```bash
# For testnet
cd skills/hoodi/assets/foundry-template

# For mainnet
cd skills/mainnet/assets/foundry-template

# Then:
cp .env.example .env
# Edit .env with your private key

# Install dependencies
forge install

# Build with Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Deploy (testnet example)
FOUNDRY_PROFILE=layer2 forge create src/Counter.sol:Counter \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

### Testing the Plugin Locally

```bash
# Run Claude Code with the plugin loaded
claude --plugin-dir ./taiko-ai

# Then use the skills
/taiko:hoodi
/taiko:mainnet
```

## Resources

- [Taiko Documentation](https://docs.taiko.xyz)
- [Taiko GitHub](https://github.com/taikoxyz/taiko-mono)
- [Bridge UI (Mainnet)](https://bridge.taiko.xyz)
- [Bridge UI (Testnet)](https://bridge.hoodi.taiko.xyz)
- [Block Explorer (Mainnet)](https://taikoscan.io)
- [Block Explorer (Testnet)](https://hoodi.taikoscan.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)

## Contributing

Contributions are welcome! Please read the shared documentation before making changes to ensure consistency.

## License

MIT License - see [LICENSE](LICENSE) for details.
