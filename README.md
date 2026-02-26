# Taiko AI

An AI agent plugin for developing on Taiko networks.

## Installation

### Any AI agent (Cursor, Copilot, Codex, Windsurf, Cline, etc.)

```bash
npx skills add taikoxyz/taiko-ai
```

### Claude Code (full experience with agent behavior, tool scoping, and branding)

```bash
/plugin marketplace add taikoxyz/taiko-ai
/plugin install taiko@taikoxyz
```

## Usage

```
/taiko
```

Covers both **Taiko Alethia** (mainnet, chain ID `167000`) and **Taiko Hoodi** (testnet, chain ID `167013`).

## Structure

```
skills/taiko/
├── SKILL.md                          # Main skill (auto-loaded)
├── references/                       # Lazy-loaded docs
│   ├── mainnet.md / hoodi.md         # Network-specific config
│   └── *.md                          # Protocol docs (bridge, security, etc.)
├── examples/                         # Python and Solidity examples
└── assets/foundry-template/          # Ready-to-use Foundry project
agents/
└── taiko-developer.md                # Subagent for Taiko development
```

## Resources

- [Taiko Docs](https://docs.taiko.xyz) | [GitHub](https://github.com/taikoxyz/taiko-mono)
- [Taikoscan](https://taikoscan.io) | [Hoodi Taikoscan](https://hoodi.taikoscan.io)
- [Bridge](https://bridge.taiko.xyz) | [Hoodi Bridge](https://bridge.hoodi.taiko.xyz)

## License

MIT
