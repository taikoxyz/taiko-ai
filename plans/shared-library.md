# @taikoxyz/taiko-api-client — Shared Library Plan

## Status
[x] Implemented — `packages/taiko-api-client/` built and tested. Etherscan V2 API used (`api.etherscan.io/v2/api?chainid=`). Relayer URL TBD (relayer.taiko.xyz doesn't resolve — see open questions).

## Summary

`@taikoxyz/taiko-api-client` is an internal TypeScript npm package providing typed HTTP clients for the three external APIs that multiple Taiko MCPs and the CLI share: **Taikoscan** (Etherscan-compatible), **Blockscout v2**, and the **Taiko Relayer**. It lives in `packages/taiko-api-client/` and is imported by `taiko-data`, `taiko-bridge`, `taiko-explorer`, and `@taiko/cli`. The `taiko-node-monitor` MCP (Python) does not use it.

Building this package first prevents duplication of API plumbing across 4 packages and creates a single point to update when Taikoscan/Blockscout API endpoints change.

---

## Prerequisites

- Node.js ≥ 20 (ESM, `fetch` API)
- Root `package.json` with npm workspaces configured

---

## Target File Structure

```
taikoxyz/taiko-ai/
├── package.json                        # Root: workspaces: ["mcp-servers/*", "packages/*", "cli"]
└── packages/
    └── taiko-api-client/
        ├── package.json                # @taikoxyz/taiko-api-client, private: false
        ├── tsconfig.json
        ├── src/
        │   ├── index.ts                # Re-exports all clients
        │   ├── networks.ts             # Network config constants
        │   ├── taikoscan.ts            # Taikoscan Etherscan-compatible API client
        │   ├── blockscout.ts           # Blockscout v2 REST API client
        │   └── relayer.ts              # Taiko bridge relayer API client
        └── tests/
            ├── taikoscan.test.ts
            ├── blockscout.test.ts
            └── relayer.test.ts
```

---

## Environment Variables

| Var | Required | Default | Description |
|-----|----------|---------|-------------|
| `TAIKOSCAN_API_KEY` | Yes | — | Taikoscan API key (applies both networks) |
| `TAIKO_MAINNET_RPC` | No | `https://rpc.mainnet.taiko.xyz` | Mainnet RPC override |
| `TAIKO_HOODI_RPC` | No | `https://rpc.hoodi.taiko.xyz` | Hoodi RPC override |

---

## API Surface

### `networks.ts` — Network Constants

```typescript
export const NETWORKS = {
  mainnet: {
    chainId: 167000,
    rpc: "https://rpc.mainnet.taiko.xyz",
    taikoscan: "https://api.taikoscan.io/api",
    blockscout: "https://blockscoutapi.mainnet.taiko.xyz/api/v2",
    relayer: "https://relayer.taiko.xyz",
    bridge: "0x1670000000000000000000000000000000000001",
    signalService: "0x1670000000000000000000000000000000000005",
    anchor: "0x1670000000000000000000000000000000010001",
    taikoscanExplorer: "https://taikoscan.io",
  },
  hoodi: {
    chainId: 167013,
    rpc: "https://rpc.hoodi.taiko.xyz",
    taikoscan: "https://api.hoodi.taikoscan.io/api",
    blockscout: "https://blockscoutapi.hoodi.taiko.xyz/api/v2",
    relayer: "https://relayer.hoodi.taiko.xyz",
    bridge: "0x1670130000000000000000000000000000000001",
    signalService: "0x1670130000000000000000000000000000000005",
    anchor: "0x1670000000000000000000000000000000010001",
    taikoscanExplorer: "https://hoodi.taikoscan.io",
  },
} as const;

export type Network = keyof typeof NETWORKS;
```

### `taikoscan.ts` — Taikoscan Client

Wraps the Etherscan-compatible API at `https://api.taikoscan.io/api`.

Key methods:
- `getBalance(address, network)` → ETH balance
- `getTransactions(address, network, page?, limit?)` → tx list
- `getTokenTransfers(address, network, token?)` → ERC-20 transfers
- `getContractABI(address, network)` → ABI JSON
- `getContractSource(address, network)` → source + compiler info
- `getContractCreator(address, network)` → creator + deploy tx
- `getNFTHoldings(address, network, type?)` → ERC-721/1155 holdings
- `getGasOracle(network)` → safe/propose/fast gas prices
- `getTransactionByHash(hash, network)` → tx details

### `blockscout.ts` — Blockscout v2 Client

Wraps the Blockscout REST v2 API at `https://blockscoutapi.mainnet.taiko.xyz/api/v2`.

Key methods:
- `search(query, network)` → search by address/tx/block/token
- `getAddressCounters(address, network)` → tx/token count metrics
- `getSimilarContracts(address, network)` → contracts with same bytecode
- `getSmartContract(address, network)` → full contract details

### `relayer.ts` — Taiko Bridge Relayer Client

Wraps the Taiko Relayer REST API at `https://relayer.taiko.xyz`.

Key methods:
- `getMessageStatus(msgHash, network)` → bridge message relay status
- `getPendingMessages(address, network)` → messages awaiting relay
- `getBlockInfo(network)` → current L1/L2 sync status
- `getBridgeHistory(address, network)` → historical bridge messages

---

## Implementation Steps

1. **Bootstrap workspace**
   - Add `"workspaces": ["mcp-servers/*", "packages/*"]` to root `package.json`
   - `mkdir -p packages/taiko-api-client/src packages/taiko-api-client/tests`

2. **Initialize package**
   - `packages/taiko-api-client/package.json`: name `@taikoxyz/taiko-api-client`, `"type": "module"`, `"exports": "./dist/index.js"`
   - `tsconfig.json`: `"module": "NodeNext"`, `"target": "ES2022"`, `"strict": true`
   - Install deps: `typescript`, `@types/node`
   - Note: use native `fetch` (Node 20+), no `node-fetch` dependency

3. **Implement `networks.ts`** — constants only, no logic

4. **Implement `taikoscan.ts`**
   - Base fetch helper: appends `&apikey=` from env, handles `result`/`status` response envelope
   - Each method maps to one Taikoscan `?module=X&action=Y` call
   - Rate limit: Taikoscan free tier is 5 req/s — add 200ms minimum between calls in the client

5. **Implement `blockscout.ts`**
   - Base fetch helper: GET `{blockscout}/endpoint`
   - Blockscout v2 returns clean JSON without the `{status, result}` envelope

6. **Implement `relayer.ts`**
   - Verify API schema against live relayer: `GET https://relayer.taiko.xyz/events?address=0x...`
   - Relayer API schema is undocumented — inspect bridge.taiko.xyz network traffic or read Go source in `taikoxyz/taiko-mono/packages/relayer/`

7. **Write tests** (integration tests using real APIs — mark as `it.skip` in CI until API keys set up)

8. **Export from `index.ts`**: re-export all clients and `NETWORKS`

9. **Build**: `npm run build` — verify `dist/` output

---

## Hosting

This is a library package — no hosting needed. Imported by other packages in the monorepo.

---

## Verification

```bash
# Install workspace deps
npm install

# Build the package
cd packages/taiko-api-client && npm run build

# Smoke test (requires TAIKOSCAN_API_KEY env var)
node -e "
import { TaikoscanClient, NETWORKS } from './dist/index.js';
const client = new TaikoscanClient(process.env.TAIKOSCAN_API_KEY);
const bal = await client.getBalance('0x0000777735367b36bC9B61C50022d9D0700dB4Ec', 'mainnet');
console.log('GOLDEN_TOUCH_ADDRESS balance:', bal);
"

# Verify Blockscout
node -e "
import { BlockscoutClient } from './dist/index.js';
const client = new BlockscoutClient();
const result = await client.search('TAIKO', 'mainnet');
console.log('Blockscout search result:', result.items?.length, 'items');
"
```
