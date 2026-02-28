# taiko-explorer MCP — Implementation Plan

## Status
[ ] Not started

## Summary

`taiko-explorer` provides AI agents with smart contract analysis tools for Taiko: ABI fetching, calldata decoding, source verification, Shanghai EVM compatibility checking, security analysis, and contract metrics. It is forked from `crazyrabbitLTC/mcp-etherscan-server` (MIT, TypeScript) with the Etherscan base URL swapped to `https://api.taikoscan.io/api` and 4 new tools added. Read-only tools (6 of 7) deploy to **Cloudflare Workers** (free tier). `analyze_contract` (requires Slither subprocess) deploys to **Railway or Fly.io** (~$5-8/month) or runs locally.

`check_taiko_compatibility` — the Shanghai EVM opcode scanner — is the uniquely Taiko-specific tool in this MCP (no other explorer MCP has it).

---

## Prerequisites

- `packages/taiko-api-client/` built (for Blockscout v2 calls — see `plans/shared-library.md`)
- Taikoscan API key
- Cloudflare account (for Workers deployment)
- Railway or Fly.io account (for `analyze_contract` deployment, ~$5-8/month)
- Slither installed locally for development: `pip install slither-analyzer`

---

## Target File Structure

```
mcp-servers/taiko-explorer/
├── package.json                # @taikoxyz/mcp-explorer, version 0.1.0
├── tsconfig.json
├── wrangler.toml               # CF Workers config (6 read-only tools)
├── Dockerfile                  # For analyze_contract on Railway/Fly.io
├── src/
│   ├── index.ts                # Entry: stdio (local, all 7 tools)
│   ├── worker.ts               # Entry: CF Workers (6 read-only tools)
│   ├── server.ts               # McpServer setup
│   ├── config.ts               # Network constants
│   ├── tools/
│   │   ├── abi-tools.ts        # get_contract_creator, verify_source (from mcp-etherscan-server)
│   │   ├── decode-tools.ts     # decode_calldata
│   │   ├── compat-tools.ts     # check_taiko_compatibility (opcode scanner)
│   │   ├── metrics-tools.ts    # get_similar_contracts, get_contract_metrics (Blockscout v2)
│   │   └── analyze-tools.ts    # analyze_contract (Slither subprocess)
│   └── lib/
│       ├── opcodes.ts          # Blocked opcode constants + scanner
│       ├── signatures.ts       # openchain.xyz + 4byte.directory lookup
│       └── slither.ts          # Slither subprocess runner
└── tests/
    └── opcode-scanner.test.ts
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKOSCAN_API_KEY` | Yes | — | Taikoscan API key |
| `TAIKO_MAINNET_RPC` | No | `https://rpc.mainnet.taiko.xyz` | Mainnet RPC (for `check_taiko_compatibility`) |
| `TAIKO_HOODI_RPC` | No | `https://rpc.hoodi.taiko.xyz` | Hoodi RPC |
| `SLITHER_PATH` | No | `slither` | Path to Slither binary (for `analyze_contract`) |

---

## Tools

| Tool | Description | API | CF Workers? |
|------|-------------|-----|-------------|
| `get_contract_creator` | Creator address + deploy transaction | Taikoscan `getcontractcreation` | ✅ Yes |
| `verify_source` | Verify contract source on Taikoscan | Taikoscan `verifysourcecode` | ✅ Yes |
| `decode_calldata` | Decode hex calldata to human-readable function + args | openchain.xyz → 4byte.directory → Taikoscan ABI | ✅ Yes |
| `check_taiko_compatibility` | Scan bytecode for opcodes not supported on Taiko's Shanghai EVM | Taiko RPC `eth_getCode` + in-process scanner | ✅ Yes |
| `get_similar_contracts` | Find contracts with same bytecode on Taiko | Blockscout v2 `/smart-contracts/{addr}/similar` | ✅ Yes |
| `get_contract_metrics` | Tx count, unique callers, age for contract | Blockscout v2 `/addresses/{addr}/counters` | ✅ Yes |
| `analyze_contract` | Security analysis (Slither) — detects 80+ vulnerability types | Taikoscan source + Slither subprocess | ❌ Railway/Fly.io only |

---

## Implementation Steps

### Step 1: Fork mcp-etherscan-server

```bash
cd mcp-servers/taiko-explorer
# Clone source from https://github.com/crazyrabbitLTC/mcp-etherscan-server
# Verify MIT license
# Update package.json: name = "@taikoxyz/mcp-explorer"
npm install
```

### Step 2: Swap API base URLs to Taikoscan

```typescript
// src/config.ts
export const NETWORKS = {
  mainnet: {
    chainId: 167000,
    taikoscan: "https://api.taikoscan.io/api",
    blockscout: "https://blockscoutapi.mainnet.taiko.xyz/api/v2",
    rpc: process.env.TAIKO_MAINNET_RPC ?? "https://rpc.mainnet.taiko.xyz",
  },
  hoodi: {
    chainId: 167013,
    taikoscan: "https://api.hoodi.taikoscan.io/api",
    blockscout: "https://blockscoutapi.hoodi.taiko.xyz/api/v2",
    rpc: process.env.TAIKO_HOODI_RPC ?? "https://rpc.hoodi.taiko.xyz",
  },
} as const;
```

The base mcp-etherscan-server tools (`get_contract_abi`, `get_contract_source_code`, `get_transaction_by_hash`) work after URL swap with `network` param added.

### Step 3: Implement `decode_calldata`

**Priority cascade**:
1. If `address` provided: fetch ABI from Taikoscan, decode with ABI (most accurate)
2. Query openchain.xyz: `GET https://api.openchain.xyz/signature-database/v1/lookup?function={selector}`
3. Fallback to 4byte.directory: `GET https://www.4byte.directory/api/v1/signatures/?hex_signature={selector}`
4. Final fallback: return raw selector + hex args

```typescript
server.tool("decode_calldata", "Decode transaction calldata to human-readable format",
  {
    calldata: z.string().describe("Hex calldata starting with 0x"),
    address: z.string().optional().describe("Contract address for ABI lookup"),
    network: z.enum(["mainnet", "hoodi"]).default("mainnet"),
  },
  async ({ calldata, address, network }) => {
    const selector = calldata.slice(0, 10); // 0x + 4 bytes = 10 chars
    if (address) {
      const abi = await getTaikoscanABI(address, network);
      if (abi) return decodeWithABI(calldata, abi);
    }
    const sig = await lookupSignature(selector);
    if (sig) return decodeWithSignature(calldata, sig);
    return { raw: calldata, selector, args: calldata.slice(10) };
  }
);
```

### Step 4: Implement `check_taiko_compatibility` — the core Taiko-specific tool

**Blocked opcodes** (in Cancun/Prague but NOT in Shanghai — current Taiko EVM):

```typescript
// src/lib/opcodes.ts
const BLOCKED_OPCODES: Record<number, string> = {
  0x5C: "TLOAD",       // EIP-1153 transient storage load
  0x5D: "TSTORE",      // EIP-1153 transient storage store
  0x5E: "MCOPY",       // EIP-5656 memory copy
  0x49: "BLOBHASH",    // EIP-4844 blob hash
  0x4A: "BLOBBASEFEE", // EIP-7516 blob base fee
};
// Note: PUSH0 (0x5F) is Shanghai — NOT blocked on Taiko

// PUSH1=0x60 through PUSH32=0x7f push N bytes of immediate data
function getImmediateBytes(opcode: number): number {
  if (opcode >= 0x60 && opcode <= 0x7f) return opcode - 0x5f;
  return 0;
}

export function scanBlockedOpcodes(bytecode: string): Issue[] {
  const bytes = Buffer.from(bytecode.replace("0x", ""), "hex");
  const issues: Issue[] = [];
  let i = 0;
  while (i < bytes.length) {
    const op = bytes[i];
    if (op in BLOCKED_OPCODES) {
      issues.push({ offset: i, opcode: `0x${op.toString(16).padStart(2, "0")}`, name: BLOCKED_OPCODES[op] });
    }
    i += 1 + getImmediateBytes(op); // Skip PUSH immediate data — critical to avoid false positives
  }
  return issues;
}
```

**Tool implementation**:
```typescript
server.tool("check_taiko_compatibility", "Check if contract bytecode uses opcodes unsupported on Taiko's Shanghai EVM",
  { address: z.string(), network: z.enum(["mainnet", "hoodi"]).default("mainnet") },
  async ({ address, network }) => {
    const code = await fetch(NETWORKS[network].rpc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getCode", params: [address, "latest"], id: 1 }),
    }).then(r => r.json()).then(d => d.result);
    const issues = scanBlockedOpcodes(code);
    return {
      address, network,
      compatible: issues.length === 0,
      issues,
      note: issues.length > 0
        ? "Contract uses opcodes not available on Taiko's Shanghai EVM. Will fail on-chain."
        : "Contract is compatible with Taiko's Shanghai EVM.",
    };
  }
);
```

### Step 5: Implement Blockscout v2 tools

**`get_similar_contracts`**:
```typescript
const res = await fetch(`${NETWORKS[network].blockscout}/smart-contracts/${address}/similar`);
```

**`get_contract_metrics`**:
```typescript
const res = await fetch(`${NETWORKS[network].blockscout}/addresses/${address}/counters`);
// Returns: tx_count, token_transfers_count, gas_usage_count, validations_count
```

**Note**: Verify these endpoints are available on Taiko's Blockscout instance before committing to them.

### Step 6: Implement `analyze_contract` with Slither

```typescript
import { execFile } from "child_process";
import { promisify } from "util";
import * as tmp from "tmp";
import * as fs from "fs";

const execFileAsync = promisify(execFile);

async function runSlither(sourceCode: string, compilerVersion: string): Promise<SlitherResult> {
  const tmpFile = tmp.fileSync({ postfix: ".sol" });
  fs.writeFileSync(tmpFile.name, sourceCode);
  try {
    const result = await execFileAsync("slither", [
      tmpFile.name,
      "--json", "-",
      "--solc-remaps", "@openzeppelin=node_modules/@openzeppelin",
    ], { timeout: 120_000 }); // 2 min timeout
    return JSON.parse(result.stdout);
  } finally {
    tmpFile.removeCallback();
  }
}
```

**Dockerfile for Railway/Fly.io**:
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y nodejs npm
RUN pip install slither-analyzer
RUN npm install -g solc-select
WORKDIR /app
COPY . .
RUN npm install && npm run build
CMD ["node", "dist/index-http.js"]
```

### Step 7: CF Workers deployment (6 read-only tools)

```toml
# wrangler.toml
name = "taiko-explorer-mcp"
main = "dist/worker.js"
compatibility_date = "2025-01-01"
```

```bash
wrangler secret put TAIKOSCAN_API_KEY
wrangler deploy
```

The `analyze_contract` tool is excluded from `worker.ts` — it requires subprocess capability.

---

## Hosting

**Cloudflare Workers (free tier)**: 6 read-only tools
- `get_contract_creator`, `verify_source`, `decode_calldata`, `check_taiko_compatibility`, `get_similar_contracts`, `get_contract_metrics`

**Railway (~$5/month) or Fly.io (~$3-7/month)**: `analyze_contract`
- Dockerfile includes Python 3.11 + Slither + Node.js

**Local stdio**: All 7 tools (developer use, Slither installed locally)

**v1 recommendation**: Ship local stdio with all 7 tools. Add CF Workers in v2 for read-only hosted access.

---

## Verification

1. `get_contract_creator` for TaikoAnchor (`0x1670000000000000000000000000000000010001`) — should return Taiko Labs deployer
2. `decode_calldata` with a known Taiko Bridge tx calldata — should decode `sendMessage` function + args
3. `check_taiko_compatibility` for TaikoAnchor — should return `compatible: true`
4. `check_taiko_compatibility` for a known Cancun contract (deploy one on Hoodi) — should return `compatible: false` with TLOAD/TSTORE issues
5. `get_contract_metrics` for TaikoAnchor — should return tx count in thousands
6. `analyze_contract` for a simple test contract — should complete in <120s with findings

---

## Research Notes

<!-- Merged from research_impl_taiko_explorer.md — reference only -->

### Framework Decision
Fork `crazyrabbitLTC/mcp-etherscan-server` — already implements `get_contract_abi` and `get_contract_source_code` against Etherscan-compatible APIs, covering ~4 of 7 tools with minimal changes.

**Why NOT Blockscout MCP**: Taikoscan uses Etherscan API format; Blockscout MCP targets Blockscout REST v2 format. Incompatible bases.

**Blockscout v2**: IS available at `blockscoutapi.mainnet.taiko.xyz/api/v2/` — use for `get_similar_contracts` and `get_contract_metrics`.

### Static Analysis Tools
| Tool | Language | Install | Use Case |
|------|----------|---------|---------|
| **Slither** | Python | `pip install slither-analyzer` | Primary — fastest, best JSON output, 80+ detector types |
| **Mythril** | Python | `pip install mythril` | Deep scan option (`analyze_contract(deep=true)`) — slower |
| **Heimdall** | Rust | Binary download | Bytecode decompilation when no source available |

### Blocked Opcodes (Shanghai vs Cancun)
| Opcode | Hex | EIP | Status on Taiko |
|--------|-----|-----|-----------------|
| TLOAD | `0x5C` | EIP-1153 | ❌ Blocked |
| TSTORE | `0x5D` | EIP-1153 | ❌ Blocked |
| MCOPY | `0x5E` | EIP-5656 | ❌ Blocked |
| BLOBHASH | `0x49` | EIP-4844 | ❌ Blocked |
| BLOBBASEFEE | `0x4A` | EIP-7516 | ❌ Blocked |
| PUSH0 | `0x5F` | Shanghai | ✅ **Available** (Shanghai added it) |

### Signature Database Strategy
1. openchain.xyz (primary, free, no API key, fast): `GET https://api.openchain.xyz/signature-database/v1/lookup?function={selector}`
2. 4byte.directory (fallback): `GET https://www.4byte.directory/api/v1/signatures/?hex_signature={selector}`
3. Taikoscan ABI (if address provided, most accurate)

### Open Questions
| Question | Impact | How to Validate |
|----------|--------|-----------------|
| Is `/api/v2/smart-contracts/{addr}/similar` available on Taiko Blockscout? | Medium | `curl https://blockscoutapi.mainnet.taiko.xyz/api/v2/smart-contracts/0x1670.../similar` |
| Does Taikoscan support `verifysourcecode` API action? | High | Test with a known verified contract |
| Hoodi Blockscout URL | Medium | Check `https://blockscoutapi.hoodi.taiko.xyz` |
| Taikoscan API rate limit on free tier | Medium | Test empirically |
