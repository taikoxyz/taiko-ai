# Taiko Hoodi Subagent Research

Research document for creating a Claude Code subagent specialized in developing and testing smart contracts on the Taiko Hoodi network.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Claude Code Subagent Architecture](#claude-code-subagent-architecture)
3. [Existing Blockchain Subagent Analysis](#existing-blockchain-subagent-analysis)
4. [Taiko-Specific Requirements](#taiko-specific-requirements)
5. [Technical Implementation Plan](#technical-implementation-plan)
6. [Address Constants Design](#address-constants-design)
7. [Foundry Integration](#foundry-integration)
8. [OpenZeppelin Integration](#openzeppelin-integration)
9. [Questions for Stakeholder](#questions-for-stakeholder)
10. [Sources](#sources)

---

## Executive Summary

This document outlines the research findings for creating a specialized Claude Code subagent for Taiko Hoodi network development. The subagent will enable AI agents to design, develop, test, and deploy smart contracts on Taiko's Type-1 ZK-EVM L2 network.

**Key Findings:**
- Claude Code subagents are defined as Markdown files with YAML frontmatter
- Subagents can have isolated contexts, specific tools, custom models, and persistent memory
- Existing blockchain subagents (e.g., [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)) provide excellent templates
- Taiko requires Shanghai EVM compatibility (`FOUNDRY_PROFILE=layer2`)
- Taiko brand accent color: **#E81899** (Taiko Pink)

---

## Claude Code Subagent Architecture

Based on [Claude Code documentation](https://code.claude.com/docs/en/sub-agents):

### Subagent File Structure

```yaml
---
name: taiko-hoodi-developer
description: "Use when developing smart contracts for Taiko Hoodi testnet"
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
color: "#E81899"  # Taiko Pink
permissionMode: default
memory: project
skills:
  - taiko:hoodi
---

System prompt content here...
```

### Key Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier (lowercase, hyphens) |
| `description` | Yes | When Claude should delegate to this subagent |
| `tools` | No | Tools the subagent can use (inherits all if omitted) |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` |
| `color` | No | Background color for UI identification |
| `permissionMode` | No | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `memory` | No | `user`, `project`, or `local` for persistent memory |
| `skills` | No | Skills to preload into subagent context |
| `hooks` | No | Lifecycle hooks (PreToolUse, PostToolUse, Stop) |
| `maxTurns` | No | Maximum agentic turns before stopping |
| `isolation` | No | Set to `worktree` for git worktree isolation |

### Subagent Storage Locations

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag | Current session | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All projects (user) | 3 |
| Plugin's `agents/` directory | Where plugin is enabled | 4 (lowest) |

---

## Existing Blockchain Subagent Analysis

### 1. VoltAgent Blockchain Developer

From [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/categories/07-specialized-domains/blockchain-developer.md):

**Strengths:**
- Comprehensive smart contract development checklist
- Gas optimization patterns
- Security patterns (CEI, reentrancy guards)
- Cross-chain development guidance
- Testing strategies (unit, fork, fuzz, invariant)

**Structure:**
```yaml
---
name: blockchain-developer
description: "Use this agent when building smart contracts, DApps..."
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---
```

**Checklist Pattern:**
```markdown
Blockchain development checklist:
- 100% test coverage achieved
- Gas optimization applied thoroughly
- Security audit passed completely
- Slither/Mythril clean verified
- Documentation complete accurately
```

### 2. Solidity Expert Agent

From [pluginagentmarketplace/custom-plugin-blockchain](https://github.com/pluginagentmarketplace/custom-plugin-blockchain):

**Strengths:**
- Detailed Solidity patterns (CEI, UUPS, Diamond)
- Foundry test examples included
- Error handling with custom errors
- Decision matrix for agent delegation

**Notable Features:**
```yaml
io_schema:
  input:
    query: string
    solidity_version: string | null
    pattern_type: enum[security, gas, upgradability, general] | null
  output:
    solution: string
    code: string
    tests: string | null
    security_notes: array

error_handling:
  retry_count: 3
  fallback_agent: 02-ethereum-development
```

### 3. Crane Test Generator

From [cyotee/cyotee-claude-plugin-crane](https://github.com/cyotee/cyotee-claude-plugin-crane):

**Strengths:**
- Specialized for test infrastructure generation
- Behavior libraries for interface compliance
- Handler contracts for invariant testing
- Clear file placement conventions

**Test Generation Pattern:**
```
contracts/{path}/
├── Behavior_I{Name}.sol      # Behavior library
├── TestBase_I{Name}.sol      # TestBase contract
└── {Name}Handler.sol         # Handler (if invariant tests)

test/foundry/spec/{path}/
└── {Name}.t.sol              # Test spec
```

### 4. Flow Blockchain Integration

From [Flow Developer Portal](https://developers.flow.com/blockchain-development-tutorials/use-AI-to-build-on-flow/llms/claude-code):

**Key Approach:**
- Hierarchical CLAUDE.md files for different contexts
- MCP servers for blockchain interaction (`flow_mcp`, `flow-defi-mcp`)
- Four-stage methodology: Idea → Visualization → Planning → Build
- Test-driven development emphasis

### 5. Coinbase AgentKit

From [Coinbase AgentKit](https://github.com/coinbase/agentkit):

**Approach:**
- Wallet-agnostic, framework-agnostic design
- Action providers for common operations
- Support for multiple frameworks (LangChain, Vercel AI SDK, MCP)
- Networks: Base, Ethereum, Solana

**Relevance to Taiko:**
- Pattern for action providers could inform Taiko-specific actions
- MCP integration model is applicable

---

## Taiko-Specific Requirements

### Network Configuration

| Property | Value |
|----------|-------|
| Network Name | Taiko Hoodi |
| Chain ID | `167013` |
| RPC URL | `https://rpc.hoodi.taiko.xyz` |
| Currency | ETH |
| Block Explorer | `https://hoodi.taikoscan.io` |
| EVM Version | **Shanghai** (Type-1 ZK-EVM) |
| Solidity Version | `^0.8.24` (protocol uses `0.8.30`) |

### L1 Configuration (Hoodi)

| Property | Value |
|----------|-------|
| Network Name | Hoodi (Ethereum Testnet) |
| Chain ID | `560048` |
| RPC URL | `https://hoodi.drpc.org` |

### Critical Constraint: EVM Version

**IMPORTANT:** Taiko L2 uses Shanghai EVM. All Foundry commands MUST use:

```bash
FOUNDRY_PROFILE=layer2 forge build
FOUNDRY_PROFILE=layer2 forge test
FOUNDRY_PROFILE=layer2 forge script ...
```

Without this, contracts will compile with Prague EVM opcodes (like PUSH0) that are not supported on Taiko.

### Taiko Brand Colors

| Color | Hex Code | Usage |
|-------|----------|-------|
| **Taiko Pink** (Primary) | `#E81899` | Accent color for subagent |
| Dark | `#0C101B` | Background |
| Purple | `#5D07C8` | Secondary |
| Teal | `#6ECFB0` | Secondary |
| Coral | `#FC6264` | Secondary |
| Cream | `#FFE2A0` | Secondary |

Source: [Taiko Brand Assets](https://taiko.xyz/brand-assets)

---

## Technical Implementation Plan

### Proposed Subagent Structure

```
taiko-ai/
├── agents/
│   └── taiko-hoodi-developer.md    # Main subagent
├── skills/
│   ├── hoodi/
│   │   ├── SKILL.md                # Existing skill
│   │   └── ...
│   └── shared/
│       └── ...
└── .claude-plugin/
    └── plugin.json
```

### Subagent Capabilities

1. **Smart Contract Development**
   - Scaffold new Foundry projects with Taiko configuration
   - Write Solidity contracts with security patterns
   - Optimize for gas efficiency

2. **Testing**
   - Generate unit tests with Foundry
   - Create fork tests against live Taiko state
   - Implement fuzz and invariant tests

3. **Deployment**
   - Deploy contracts with correct EVM version
   - Verify on Taikoscan and Blockscout
   - Handle cross-chain deployments

4. **Cross-Chain Operations**
   - Bridge interactions (L1 ↔ L2)
   - Signal verification
   - Message passing via IBridge

### Suggested Subagent Definition

```yaml
---
name: taiko-hoodi-developer
description: >
  Use this agent when developing, testing, or deploying smart contracts
  on Taiko Hoodi testnet. Triggers: "Taiko", "Hoodi", "L2 deployment",
  "bridge contract", "cross-chain". Use proactively after writing Solidity code.
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
color: "#E81899"
memory: project
skills:
  - taiko:hoodi
hooks:
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: |
            if [[ "$TOOL_INPUT" == *".sol"* ]]; then
              FOUNDRY_PROFILE=layer2 forge build --silent 2>&1 | head -20
            fi
---

You are a senior blockchain developer specializing in Taiko network development.

## Critical Rules

1. **ALWAYS use `FOUNDRY_PROFILE=layer2`** for all Foundry commands
2. Taiko uses **Shanghai EVM** - no Prague opcodes (PUSH0, etc.)
3. Check contract addresses in `TaikoHoodiAddresses.sol` before hardcoding
4. Use custom errors instead of require strings for gas efficiency
5. Follow CEI pattern (Checks-Effects-Interactions) for all state changes

## Network Configuration

- **Chain ID**: 167013
- **RPC**: https://rpc.hoodi.taiko.xyz
- **Explorer**: https://hoodi.taikoscan.io
- **L1 (Hoodi)**: Chain ID 560048, RPC https://hoodi.drpc.org

## Development Workflow

When asked to develop a contract:

1. **Scaffold**: Create Foundry project with layer2 profile
2. **Implement**: Write contract with security patterns
3. **Test**:
   - Unit tests: `FOUNDRY_PROFILE=layer2 forge test`
   - Fork tests: `FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz`
4. **Deploy**: Use deployment scripts with `--broadcast`
5. **Verify**: Submit to Taikoscan or Blockscout

## Security Checklist

Before deployment, verify:
- [ ] CEI pattern followed
- [ ] Reentrancy guards where needed
- [ ] Access control implemented
- [ ] Input validation complete
- [ ] Events emitted for state changes
- [ ] Custom errors used (not require strings)
- [ ] No hardcoded addresses (use constants library)

## Key Addresses

Always import from TaikoHoodiAddresses.sol:
- Bridge: 0x1670130000000000000000000000000000000001
- SignalService: 0x1670130000000000000000000000000000000005
- TaikoL2: 0x1670130000000000000000000000000000010001
```

---

## Address Constants Design

### Solidity Constants Library

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TaikoHoodiAddresses
/// @notice Protocol contract addresses for Taiko Hoodi L2 (Chain ID: 167013)
/// @dev Import this library to use well-known addresses as constants
library TaikoHoodiAddresses {
    // ═══════════════════════════════════════════════════════════════════════
    // CHAIN CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════

    uint64 public constant TAIKO_HOODI_CHAIN_ID = 167013;
    uint64 public constant L1_HOODI_CHAIN_ID = 560048;

    // ═══════════════════════════════════════════════════════════════════════
    // L2 PROTOCOL CONTRACTS (Taiko Hoodi)
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Bridge contract for cross-chain messaging
    address public constant L2_BRIDGE = 0x1670130000000000000000000000000000000001;

    /// @notice ERC20Vault for token bridging
    address public constant L2_ERC20_VAULT = 0x1670130000000000000000000000000000000002;

    /// @notice ERC721Vault for NFT bridging
    address public constant L2_ERC721_VAULT = 0x1670130000000000000000000000000000000003;

    /// @notice ERC1155Vault for multi-token bridging
    address public constant L2_ERC1155_VAULT = 0x1670130000000000000000000000000000000004;

    /// @notice SignalService for low-level cross-chain signaling
    address public constant L2_SIGNAL_SERVICE = 0x1670130000000000000000000000000000000005;

    /// @notice SharedAddressManager for protocol address lookups
    address public constant L2_SHARED_ADDRESS_MANAGER = 0x1670130000000000000000000000000000000006;

    /// @notice TaikoL2 anchor contract
    address public constant TAIKO_L2 = 0x1670130000000000000000000000000000010001;

    /// @notice Rollup address manager
    address public constant L2_ROLLUP_ADDRESS_MANAGER = 0x1670130000000000000000000000000000010002;

    // ═══════════════════════════════════════════════════════════════════════
    // L2 TOKENS
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Bridged TAIKO token on L2
    address public constant BRIDGED_TAIKO_TOKEN = 0xE27FAaa626FF28C80DF8Dbd1fDF700c2290D9977;

    // ═══════════════════════════════════════════════════════════════════════
    // L1 PROTOCOL CONTRACTS (Hoodi)
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice TaikoL1 contract on L1
    address public constant L1_TAIKO = 0x537E3b76A91f49123c7b551e5597A13F89FbAAaE;

    /// @notice L1 Bridge contract
    address public constant L1_BRIDGE = 0x99C73fAc2F015c18CE89b87b98Ee0d8bEBBB9c67;

    /// @notice L1 SignalService
    address public constant L1_SIGNAL_SERVICE = 0x88cFeC3b1673fc11699A7B52f44a658C7018c3Ff;

    /// @notice L1 SharedAddressManager
    address public constant L1_SHARED_ADDRESS_MANAGER = 0x17e17D4A20403DB62BA42CA082754E3C7cef33B3;

    /// @notice TAIKO token on L1
    address public constant L1_TAIKO_TOKEN = 0x02500EE41b4f8C10f98a5086Da456F5Aaea16BC8;

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFIERS (L1)
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice SGX verifier
    address public constant SGX_VERIFIER = 0x0f98B36A95CD485F0a78eaAa8C093a4E72C18666;

    /// @notice Risc0 verifier
    address public constant RISC0_VERIFIER = 0x74Dc7Dd2c6bD5Abe62D6F67395093D75dCe4570A;

    /// @notice SP1 verifier
    address public constant SP1_VERIFIER = 0x06Ae7346d44A3de01a75a00680Be722903A6B5f1;
}
```

### Usage Pattern

```solidity
import {TaikoHoodiAddresses} from "./TaikoHoodiAddresses.sol";

contract MyContract {
    function bridgeMessage(bytes calldata data) external {
        IBridge(TaikoHoodiAddresses.L2_BRIDGE).sendMessage(...);
    }
}
```

---

## Foundry Integration

### foundry.toml Configuration

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.30"
evm_version = "prague"
optimizer = true
optimizer_runs = 200

# CRITICAL: Use for Taiko L2 deployment
[profile.layer2]
evm_version = "shanghai"

[rpc_endpoints]
taiko-hoodi = "https://rpc.hoodi.taiko.xyz"
hoodi-l1 = "https://hoodi.drpc.org"

[etherscan]
taiko-hoodi = { key = "${TAIKOSCAN_API_KEY}", url = "https://api-hoodi.taikoscan.io/api", chain = 167013 }

[fmt]
line_length = 120
tab_width = 4
bracket_spacing = false
```

### Common Commands

```bash
# Build for Taiko
FOUNDRY_PROFILE=layer2 forge build

# Test locally
FOUNDRY_PROFILE=layer2 forge test -vvv

# Fork test against live Taiko
FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.hoodi.taiko.xyz -vvv

# Deploy
FOUNDRY_PROFILE=layer2 forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast

# Verify on Taikoscan
forge verify-contract $ADDRESS src/MyContract.sol:MyContract \
  --verifier-url https://api-hoodi.taikoscan.io/api \
  --etherscan-api-key $TAIKOSCAN_API_KEY

# Verify on Blockscout
forge verify-contract $ADDRESS src/MyContract.sol:MyContract \
  --chain-id 167013 \
  --verifier blockscout \
  --verifier-url https://blockscout.hoodi.taiko.xyz/api
```

---

## OpenZeppelin Integration

### Latest Version

[OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x) is required for new deployments.

### Installation with Foundry

```bash
# Install dependencies
forge install foundry-rs/forge-std
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
forge install OpenZeppelin/openzeppelin-contracts-upgradeable@v5.0.0

# For upgradeable contracts
forge install OpenZeppelin/openzeppelin-foundry-upgrades
```

### Remappings

Add to `remappings.txt`:
```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable/=lib/openzeppelin-contracts-upgradeable/contracts/
```

### Important Warnings

From [OpenZeppelin Docs](https://docs.openzeppelin.com/contracts/5.x):

> **Never use the master branch** - It is a development branch without security guarantees.
>
> **`forge update` uses master by default** - Subsequent updates will switch to the unstable master branch unless you pin to a specific tag.

**Pin to specific version:**
```bash
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0
```

### Configuration for Upgrades

```toml
[profile.default]
ffi = true
ast = true
build_info = true
extra_output = ["storageLayout"]
```

---

## Questions for Stakeholder

### Subagent Scope

1. **Agent vs Plugin**: Should the Taiko developer be a standalone subagent or integrated into the existing `taiko` plugin?
   - Option A: Subagent in `agents/` directory (more focused, separate context)
   - Option B: Enhance existing skill with agent-like behavior

2. **Multi-Network Support**: When mainnet is added, should there be:
   - Option A: Separate subagents (`taiko-hoodi-developer`, `taiko-mainnet-developer`)
   - Option B: Single subagent with network parameter

3. **Memory Scope**: What should the subagent remember across sessions?
   - Option A: `project` scope (remembers per-project architecture decisions)
   - Option B: `user` scope (remembers across all Taiko projects)
   - Option C: No memory (stateless)

### Technical Configuration

4. **MCP Server**: Should we create a dedicated `taiko-mcp` server for:
   - Reading on-chain data
   - Managing deployments
   - Checking balances
   - Similar to Flow's `flow_mcp` integration

5. **Hooks Configuration**: Should we add automated:
   - Post-edit compilation checks (like the example above)
   - Pre-deployment security checks (Slither/Mythril)
   - Test execution after contract changes

6. **Model Selection**: Which model for the subagent?
   - `sonnet` (balanced capability/speed)
   - `opus` (deep reasoning for security-critical work)
   - `inherit` (use main conversation model)

### Address Management

7. **Address Constants File Location**: Where should `TaikoHoodiAddresses.sol` live?
   - Option A: In the Foundry template (`assets/foundry-template/src/`)
   - Option B: Separate constants package (`lib/taiko-constants/`)
   - Option C: Both (template references package)

8. **Address Updates**: How should address updates be handled when protocol upgrades occur?
   - Option A: Manual updates with version bumps
   - Option B: On-chain registry lookup
   - Option C: Generated from deployment logs

### Testing Strategy

9. **Test Requirements**: What testing patterns should the subagent enforce?
   - Unit tests only
   - Unit + Fork tests
   - Unit + Fork + Fuzz tests
   - Full coverage requirement (100%?)

10. **Security Tools**: Which security tools should be integrated?
    - Slither (static analysis)
    - Mythril (symbolic execution)
    - Aderyn (Rust-based analyzer)
    - Custom Taiko-specific checks

### Distribution

11. **Plugin Packaging**: Should the subagent be:
    - Option A: Part of the `taiko` plugin (current structure)
    - Option B: Separate `taiko-agents` plugin
    - Option C: Standalone agents directory

12. **Documentation Format**: How should the subagent be documented?
    - Option A: Inline in SKILL.md
    - Option B: Separate agents/README.md
    - Option C: Both with cross-references

---

## Sources

### Claude Code Documentation
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)

### Blockchain Agent References
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) - 127+ Claude Code subagents including blockchain-developer
- [pluginagentmarketplace/custom-plugin-blockchain](https://github.com/pluginagentmarketplace/custom-plugin-blockchain) - Blockchain plugin with Solidity expert agent
- [0xGval/evm-mcp-tools](https://github.com/0xGval/evm-mcp-tools) - Ethereum MCP tools for Claude
- [cyotee/cyotee-claude-plugin-crane](https://github.com/cyotee/cyotee-claude-plugin-crane) - Test generator for smart contracts

### Framework Documentation
- [Flow Claude Code Integration](https://developers.flow.com/blockchain-development-tutorials/use-AI-to-build-on-flow/llms/claude-code)
- [Coinbase AgentKit](https://github.com/coinbase/agentkit) - Blockchain AI agent toolkit

### Technical References
- [OpenZeppelin Contracts v5](https://docs.openzeppelin.com/contracts/5.x)
- [OpenZeppelin Foundry Upgrades](https://docs.openzeppelin.com/upgrades-plugins/foundry/foundry-upgrades)
- [Foundry Book](https://book.getfoundry.sh/)
- [Taiko Brand Assets](https://taiko.xyz/brand-assets) - Brand colors and guidelines
- [Taiko Documentation](https://docs.taiko.xyz)

### Security Research
- [Anthropic AI Smart Contract Security Research](https://red.anthropic.com/2025/smart-contracts/) - AI agents finding $4.6M in vulnerabilities

---

*Document created: 2026-02-23*
*Last updated: 2026-02-23*
