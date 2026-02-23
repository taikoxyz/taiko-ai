# Taiko AI

A Claude Code plugin for developing on Taiko networks.

## Overview

This plugin provides skills for building, deploying, and testing smart contracts on Taiko - a Type-1 ZK-EVM based rollup on Ethereum.

## Installation

```bash
# Install the plugin (when published to a marketplace)
/plugin install <marketplace>/taiko

# Or test locally during development
claude --plugin-dir ./taiko-ai
```

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| Hoodi (testnet) | `/taiko:hoodi` | Deploy and test on Taiko Hoodi testnet |
| Mainnet | `/taiko:mainnet` | *(Coming soon)* Deploy to Taiko mainnet |

### /taiko:hoodi

Deploy, test, and interact with smart contracts on **Taiko Hoodi** (testnet).

**Features:**
- Complete Foundry setup with Shanghai EVM configuration
- Contract deployment and verification guides
- Protocol contract addresses and interfaces
- Python and Solidity examples
- Cross-chain messaging patterns

## Plugin Structure

```
taiko-ai/
├── .claude-plugin/
│   └── plugin.json            # Plugin manifest
├── skills/
│   ├── hoodi/                 # /taiko:hoodi skill
│   │   ├── SKILL.md           # Main skill file
│   │   ├── references/        # Contract addresses, network config
│   │   ├── examples/          # Python and Solidity examples
│   │   └── assets/            # Foundry template
│   └── shared/                # Network-agnostic protocol docs
├── agents/                    # Custom agents (future)
├── mcp-servers/               # MCP server implementations (future)
└── README.md
```

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
| Taiko Hoodi | 167013 | https://rpc.hoodi.taiko.xyz | https://hoodi.taikoscan.io |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) for smart contract development
- Python 3.8+ for Python examples
- [Claude Code](https://claude.ai/code) v1.0.33+ for using plugins

### Using the Foundry Template

```bash
cd skills/hoodi/assets/foundry-template
cp .env.example .env
# Edit .env with your private key

# Install dependencies
forge install

# Build with Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Deploy
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
```

## Resources

- [Taiko Documentation](https://docs.taiko.xyz)
- [Taiko GitHub](https://github.com/taikoxyz/taiko-mono)
- [Bridge UI](https://bridge.hoodi.taiko.xyz)
- [Block Explorer](https://hoodi.taikoscan.io)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)

## Contributing

Contributions are welcome! Please read the shared documentation before making changes to ensure consistency.

## License

MIT License - see [LICENSE](LICENSE) for details.
