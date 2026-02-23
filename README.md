# Taiko AI

AI-powered tools and skills for developing on Taiko networks.

## Overview

This repository contains Claude Code skills and AI tools for building, deploying, and testing smart contracts on Taiko - a Type-1 ZK-EVM based rollup on Ethereum.

## Available Skills

### taiko-hoodi

Deploy, test, and interact with smart contracts on **Taiko Hoodi** (testnet).

**Features:**
- Complete Foundry setup with Shanghai EVM configuration
- Contract deployment and verification guides
- Protocol contract addresses and interfaces
- Python and Solidity examples
- Cross-chain messaging patterns

**Quick Start:**
```bash
# Install the skill
claude plugin add taiko-ai/skills/taiko-hoodi

# Or copy the skill to your Claude Code skills directory
cp -r skills/taiko-hoodi ~/.claude/skills/
```

## Agent-Agnostic Design

This repository is designed to work with multiple AI tools:

- **Claude Code**: Uses `skills/CLAUDE.md` as entry point
- **Other AI Agents**: Uses `AGENTS.md` (symlink to `skills/CLAUDE.md`)

The skills follow a standardized format with YAML frontmatter that can be parsed by any AI tool.

## Repository Structure

```
taiko-ai/
├── AGENTS.md                  # Symlink → skills/CLAUDE.md
├── skills/
│   ├── CLAUDE.md              # Skills entry point
│   ├── shared/                # Network-agnostic protocol docs
│   └── taiko-hoodi/           # Testnet skill
│       ├── SKILL.md           # Main skill file
│       ├── references/        # Contract addresses, network config
│       ├── examples/          # Python and Solidity examples
│       └── assets/            # Foundry template
├── mcp-servers/               # Future MCP server implementations
├── agents/                    # Future agent definitions
└── README.md
```

## Skills Documentation

### Shared Protocol Knowledge

The `skills/shared/` directory contains network-agnostic documentation:

- **protocol-overview.md** - Taiko architecture, based rollup design
- **bridge-interface.md** - IBridge, SignalService interfaces
- **anchor-contract.md** - Anchor contract usage for L1 data access
- **evm-compatibility.md** - Shanghai EVM, Type-1 ZK-EVM details
- **security-checklist.md** - Smart contract security for Taiko
- **foundry-guide.md** - Foundry configuration for L2 deployment
- **cross-chain-patterns.md** - L1↔L2 messaging patterns

### Network-Specific Skills

Each network skill (e.g., `taiko-hoodi/`) contains:

- **SKILL.md** - Main skill with YAML frontmatter and instructions
- **references/** - Contract addresses and network configuration
- **examples/** - Working code examples (Python, Solidity)
- **assets/** - Foundry project template

## Quick Reference

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Taiko Hoodi | 167013 | https://rpc.hoodi.taiko.xyz | https://hoodi.taikoscan.io |

## Development

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) for smart contract development
- Python 3.8+ for Python examples
- [Claude Code](https://claude.ai/code) for using skills

### Using the Foundry Template

```bash
cd skills/taiko-hoodi/assets/foundry-template
cp .env.example .env
# Edit .env with your private key

# Build with Shanghai EVM
FOUNDRY_PROFILE=layer2 forge build

# Deploy
FOUNDRY_PROFILE=layer2 forge create src/Counter.sol:Counter \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY
```

## Resources

- [Taiko Documentation](https://docs.taiko.xyz)
- [Taiko GitHub](https://github.com/taikoxyz/taiko-mono)
- [Bridge UI](https://bridge.hoodi.taiko.xyz)
- [Block Explorer](https://hoodi.taikoscan.io)

## Contributing

Contributions are welcome! Please read the shared documentation before making changes to ensure consistency.

## License

MIT License - see [LICENSE](LICENSE) for details.
