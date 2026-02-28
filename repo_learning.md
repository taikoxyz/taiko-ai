# Repository Learning (Markdown Review)

## Scope
I reviewed the markdown corpus in this repository (37 `.md` files) to understand:
- project goals and architecture
- skills/agents behavior model
- implementation plans vs shipped code
- operational and security guidance quality

## Repository Intent
This repository is structured as an AI-operational layer for Taiko, with:
- **Skills**: reusable domain workflows (`skills/`)
- **Agents**: higher-level role prompts (`agents/`)
- **Implementation plans**: MCP + CLI roadmaps and design decisions (`plans/`, `plan.md`)
- **Code implementations**: MCP servers, shared API client, and CLI

## Markdown Inventory (High-Level)
- Root docs:
  - `README.md`
  - `plan.md`
- Planning docs (`plans/`):
  - shared API client
  - taiko-data MCP
  - taiko-node-monitor MCP
  - taiko-bridge MCP
  - taiko-explorer MCP
  - taiko CLI
- Agent docs (`agents/`):
  - taiko-developer
  - taiko-node-runner
  - taiko-shadow
  - taiko-x402
- Skill docs and references (`skills/`):
  - taiko
  - taiko-node
  - taiko-shadow
  - taiko-x402
  - with detailed `references/` and examples

## What the Markdown Tells Us About the Product
### 1. Product direction is clear
The docs define a coherent phased strategy:
- shared client library first
- data/node MCPs
- bridge/explorer MCPs
- CLI wrapping common operational workflows

### 2. Safety posture is strong in prompt/skill layers
Most agent/skill docs repeatedly enforce:
- explicit network selection (`mainnet` vs `hoodi`)
- awareness of bridge risks
- security checklists for contract and node workflows

### 3. The plan docs are implementation-oriented
Plans include:
- file trees
- expected commands
- env vars
- verification steps
- open question tracking

This is strong for onboarding contributors and AI agents.

## Key Documentation Drift Identified
### 1. Hoodi L2 address drift (`0x167D...` vs `0x167013...`)
Multiple plan docs still encode Hoodi L2 predeploys as `0x167D...`.
- This drift propagated into implementation and tests.
- Current Taiko deployment logs and live RPC code checks indicate `0x167013...` is correct.

### 2. Plan status vs reproducibility drift
Some plan pages imply “implemented/tested,” while workspace-level `npm -ws run test` currently fails due package script pathing in at least two workspaces.

### 3. CLI plan scope vs shipped CLI scope
`plans/taiko-cli.md` outlines broader command surface (including prover workflows), but current CLI implementation focuses mainly on:
- `network`
- `node`
- `bridge` (partly stubbed)
- `contract verify`

### 4. Placeholder language in production-facing docs
Some planned/implemented tool descriptions still include placeholders such as “check Taikoscan” for canonical addresses.
This is fine in planning docs, but weak for production MCP outputs.

## Strengths of the Markdown Set
- Strong domain decomposition across skills.
- Good command-level pragmatism for AI execution.
- Useful troubleshooting sections in node and shadow materials.
- Good distinction between general Taiko workflows and specialized x402/shadow workflows.

## Risks if Documentation Drift Persists
- Wrong constants can be treated as “approved truth” by downstream AI agents.
- MCP/CLI users can receive internally consistent but chain-incorrect behavior.
- CI confidence can be overstated when docs claim tested status but top-level test command fails.

## Recommended Documentation Follow-Ups
1. Establish a single source of truth for network constants and generate markdown tables from code.
2. Add a “validated on date” stamp to high-risk constants sections.
3. Distinguish clearly between `planned`, `implemented`, and `verified-in-ci` status in all plan docs.
4. Remove or explicitly flag placeholders in user-facing MCP output docs.

## Code Package Structure (New in This PR)

### Monorepo layout
```
packages/
  taiko-api-client/     # @taikoxyz/taiko-api-client — shared network constants, Taikoscan/Blockscout/Relayer clients
mcp-servers/
  taiko-data/           # @taikoxyz/mcp-data — TypeScript, ethers.js + MCP SDK
  taiko-bridge/         # @taikoxyz/mcp-bridge — TypeScript, viem + MCP SDK
  taiko-explorer/       # @taikoxyz/mcp-explorer — TypeScript, MCP SDK
  taiko-node-monitor/   # Python FastMCP + Docker SDK (NOT in npm workspaces)
cli/                    # @taiko/cli — TypeScript, commander
```

### Workspace configuration
- Root `package.json` defines npm workspaces: `packages/*`, `mcp-servers/taiko-data`, `mcp-servers/taiko-bridge`, `mcp-servers/taiko-explorer`, `cli`
- `taiko-node-monitor` is Python (pip/uv), NOT part of npm workspaces
- All TypeScript packages import `@taikoxyz/taiko-api-client` for network constants

### Build commands
| Package | Build | Test |
|---------|-------|------|
| taiko-api-client | `npm run build -w packages/taiko-api-client` | (no tests yet) |
| taiko-data | `npm run build -w mcp-servers/taiko-data` | `npm test -w mcp-servers/taiko-data` (vitest) |
| taiko-bridge | `npm run build -w mcp-servers/taiko-bridge` | `npm test -w mcp-servers/taiko-bridge` (vitest) |
| taiko-explorer | `npm run build -w mcp-servers/taiko-explorer` | `npm test -w mcp-servers/taiko-explorer` (vitest) |
| taiko-node-monitor | N/A (Python) | `cd mcp-servers/taiko-node-monitor && uv run pytest -q` |
| cli | `npm run build -w cli` | `npm test -w cli` (vitest) |

### Test counts (as of this PR)
- taiko-bridge: 18 tests
- taiko-explorer: 18 tests
- cli: 24 tests
- taiko-node-monitor: 28 tests (pytest)
- **Total: 88 tests** (60 TypeScript + 28 Python)

### Key dependency patterns
- `@taikoxyz/taiko-api-client` → `NETWORKS` constant, `TaikoscanClient`, `BlockscoutClient`, `RelayerClient`
- MCP servers → `@modelcontextprotocol/sdk`, `zod` for tool schemas
- taiko-bridge write tools → `viem` for wallet/transaction operations
- taiko-data → `ethers` v6 for RPC provider
- CLI → `commander` for command parsing, `js-yaml` for config

## Files Reviewed
All markdown files under:
- repository root
- `agents/`
- `plans/`
- `skills/` (including references and examples)

(Inventory snapshot was generated during review and stored locally in `.context/repo_md_inventory.txt`.)
