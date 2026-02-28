# AI Learning: MCP, Agents, Skills, CLI

## Scope
This document summarizes research completed on **February 28, 2026** on:
- MCP protocol fundamentals and security model
- Agent/tool architecture patterns
- Skill systems (task routing/prompt specialization)
- CLI design principles for AI-agent-friendly automation

## 1. MCP Fundamentals (Model Context Protocol)
From the MCP specification:
- MCP is a **JSON-RPC 2.0** protocol for connecting model hosts to external tools/context.
- Roles are explicitly separated:
  - **Host** (LLM app)
  - **Client** (connector inside host)
  - **Server** (tool/resource provider)
- Capabilities are negotiated at connection setup.

### Core server features
- **Tools**: executable actions
- **Resources**: retrievable context/data
- **Prompts**: reusable prompt templates/workflows

### Core client-side advanced features
- **Sampling**: server-triggered model interactions
- **Roots**: constrained file/URI scopes
- **Elicitation**: server requests for more user info

### Practical MCP implications for Taiko tooling
- If a tool can sign/send transactions, it should be clearly tagged as high-risk.
- Read-only and write tools should be separated operationally (or at minimum separated by approval policy).
- Tool descriptions must be precise; ambiguous descriptions increase model misuse.

## 2. MCP Security Learnings
From MCP security guidance:
- Major risks include confused deputy patterns, token passthrough, and session hijacking.
- OAuth redirect/state handling must be strict.
- User consent is not optional for sensitive actions.

### Directly relevant controls for blockchain MCPs
- Require explicit approval for all write operations.
- Validate destination chain/account params before signing.
- Never trust tool annotations alone; validate inputs in code.
- Use deterministic policy on per-tool approval (`always` for write operations).

## 3. Agent + Tool Architecture Learnings
From OpenAI Agents docs:
- Useful tool categories are:
  - Hosted tools
  - Local tools
  - Function tools
  - Agents-as-tools
  - MCP servers
- MCP transport choices:
  - Hosted MCP
  - Streamable HTTP MCP
  - stdio MCP
- Stdio is simplest for local/private workflows; streamable HTTP/hosted is better for shared remote services.

### Useful design pattern for this repo
- Keep blockchain write flows local via stdio MCP.
- Keep read-heavy aggregation and explorer lookups remotely hostable.
- Apply tool filtering to avoid exposing unstable/experimental tools by default.

## 4. Skills as an AI Reliability Layer
From this repo’s skill model (and AGENTS usage pattern):
- Skills are lightweight operation manuals for predictable behavior.
- Good skills include:
  - Trigger conditions
  - Required prerequisites
  - Short “critical rules”
  - Canonical command patterns
  - Safety/troubleshooting references

### Observed strengths in this repository’s skills
- Strong “always ask network” behavior in Taiko skills.
- Good use of references folder to reduce prompt size while keeping depth.
- Separation by domain (`taiko`, `taiko-node`, `taiko-shadow`, `taiko-x402`) is practical.

### Skill design lessons
- Keep default workflows short and deterministic.
- Move deep detail to references.
- Put mutable values (addresses, endpoints) behind source-of-truth links or generated constants.

## 5. CLI Design Learnings (for Humans + Agents)
From CLI guidelines and POSIX-style conventions:
- Return `0` on success, non-zero on failures.
- Send machine-readable primary output to `stdout`.
- Send diagnostics/errors to `stderr`.
- Keep command behavior predictable and composable.
- Provide robust `--help` and clear subcommand contracts.

### AI-agent-specific CLI requirements
- Add stable JSON schema output mode (`--json`) for every command.
- Avoid mixed noisy output when `--json` is used.
- Validate enum-like inputs strictly (e.g., network names).
- Ensure failures are structured and parseable.

## 6. Necessary vs Optional MCP/CLI Features (General)
### Usually necessary for L2 developer productivity
- Network health and chain metadata
- Contract ABI/source retrieval
- Transaction decoding
- Bridge message status/history
- Node sync and peer diagnostics

### Often optional or better as opt-in
- Heavy static analysis with external binaries (Slither) in default profile
- Static token lists embedded in code
- “Stub” CLI commands that imply functionality but do not execute real workflows

## 7. Recommendations for Taiko-Focused AI Tooling
- Treat protocol constants and contract addresses as versioned data assets.
- Add runtime self-checks for critical predeploy addresses.
- Gate write tools behind approval + simulation by default.
- Add reliability wrappers for third-party endpoints (relayer, explorers).
- Prefer narrow, composable commands/tools over large multipurpose actions.

## 8. SDK Implementation Patterns (from this PR)

### TypeScript MCP SDK (`@modelcontextprotocol/sdk`)
Tool registration pattern:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

server.tool(
  "tool_name",
  "Tool description for LLM",
  { param: z.string().describe("Parameter description") },
  async ({ param }) => {
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);
```

### Python FastMCP
```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("server-name")

@mcp.tool()
def tool_name(param: str) -> str:
    """Tool description for LLM."""
    return json.dumps(result)
```

### viem patterns (used in taiko-bridge write tools)
```typescript
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isAddress } from "viem";
const account = privateKeyToAccount(key as `0x${string}`);
```

### Commander CLI pattern
```typescript
import { Command } from "commander";
const program = new Command();
program.name("taiko").version("0.1.0");
program.command("sub").option("--json").action(async (opts) => { ... });
program.parse();
```

### Number() vs BigInt() precision boundary
- `Number.MAX_SAFE_INTEGER` = 2^53 - 1 = 9,007,199,254,740,991
- `uint64` max = 2^64 - 1 = 18,446,744,073,709,551,615
- **Rule:** Always use `BigInt()` for uint64 values from Solidity contracts, never `Number()`
- Affected fields: `IBridge.Message.fee`, `.id`, `.srcChainId`, `.destChainId`

## Sources
- MCP specification index: https://github.com/modelcontextprotocol/modelcontextprotocol/tree/main/docs/specification/2025-11-25
- MCP architecture: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/architecture/index.mdx
- MCP security best practices: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-11-25/basic/security_best_practices.mdx
- OpenAI Agents tools guide: https://openai.github.io/openai-agents-js/guides/tools/
- OpenAI Agents MCP guide: https://openai.github.io/openai-agents-js/guides/mcp/
- CLI guidelines: https://clig.dev
- CLI guidelines source: https://github.com/cli-guidelines/cli-guidelines
- POSIX utility conventions: https://pubs.opengroup.org/onlinepubs/9799919799/basedefs/V1_chap12.html
