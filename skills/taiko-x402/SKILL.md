---
name: taiko-x402
description: >
  Build and integrate x402 HTTP payment flows on Taiko using Taiko-operated
  facilitators. Use when adding per-request USDC payment gating to APIs
  deployed on Taiko (seller), building AI agents or clients that autonomously
  pay for x402 services (buyer), or configuring Taiko facilitators. Triggers:
  "x402", "HTTP payment", "pay per request", "monetize API", "USDC payment",
  "402 Payment Required", "facilitator.taiko.xyz", "paid API",
  "AI agent payments", "payment middleware".
---

# x402 Payments on Taiko

> **Network Selection:** If the user has not specified "hoodi" or "mainnet", always ask which network to use before proceeding.

x402 is an open HTTP payment protocol: a server responds `402 Payment Required` with a price; a client signs an EIP-712 USDC authorization and retries. No accounts, sessions, or subscriptions needed — payment is the authentication.

**Taiko runs two live facilitators** that verify and settle payments on Taiko Mainnet and Hoodi testnet. These handle EIP-3009 signature verification and on-chain USDC transfer on behalf of the buyer.

## Lifecycle

```
Buyer → GET /api → 402 (PAYMENT-REQUIRED header) → sign EIP-712 →
  retry with PAYMENT-SIGNATURE → Facilitator verifies → 200 OK
```

## Quick Decision

| Task | What to do |
|------|------------|
| Protect an API endpoint | [Seller (server) setup](./references/server.md) |
| Call a paid API from code | [Buyer (client) setup](./references/client.md) |
| Facilitator URLs, CAIP-2 IDs, USDC addresses | [Facilitators reference](./references/facilitators.md) |
| Both sides (full-stack demo) | Start with server.md, then client.md |

## Networks

| Network | CAIP-2 | Facilitator |
|---------|--------|-------------|
| Taiko Mainnet | `eip155:167000` | `https://facilitator.taiko.xyz`, `https://x402.taiko.xyz` |
| Taiko Hoodi | `eip155:167013` | `https://facilitator.taiko.xyz` only |

No CDP API key required — Taiko facilitators are independent of Coinbase's CDP.

## Common Errors

| Error | Fix |
|-------|-----|
| `No scheme registered for network` | Register the EVM scheme for `eip155:167000` or `eip155:167013` |
| `Payment already attempted` | Facilitator rejected payment — check USDC balance and allowance |
| `Invalid signature` | Signer address doesn't match `from` in EIP-712 payload |
| `Token not supported` | Use the USDC contract address listed in [facilitators reference](./references/facilitators.md) |
| 402 on every request | Middleware misconfigured — check route pattern and `payTo` address |
| `No default asset configured for network` | Use `price` as `{ amount, asset }` with the verified USDC token address for that Taiko network |

## Network Contract Addresses

USDC addresses and chain IDs are maintained in the taiko skill:
- **[taiko/references/networks.md](../taiko/references/networks.md)** — USDC contract addresses per network, chain IDs for CAIP-2 identifiers

Use `taiko network info --json` to retrieve current contract addresses programmatically:
```bash
taiko network info --json --network hoodi    # chain ID, USDC address, explorer URLs
taiko network info --json --network mainnet
```

## MCP Tools for Verification

| Task | Tool |
|------|------|
| Verify USDC contract | `get_contract_abi` — confirm it's the USDC contract before integration |
| Check buyer USDC balance | `read_contract` — call `balanceOf(address)` on USDC |
| Debug payment failure | `decode_calldata` — decode payment tx input |
| Verify payment on-chain | `get_transaction_info` — confirm 402 payment tx hash |
| Look up facilitator address | `search` — find by name on the target network |
| Fee guidance | `get_gas_price` — help users estimate appropriate payment amounts |

## Related Skills

- **Contract addresses & chain IDs:** [taiko skill](../taiko/SKILL.md)
- **Foundry & contract deployment:** [taiko/references/foundry-guide.md](../taiko/references/foundry-guide.md)

## References

- [Server setup](./references/server.md) — Express/Next.js/Hono middleware, route config, Bazaar discovery
- [Client setup](./references/client.md) — fetch/axios wrappers, wallet signer, USDC requirements
- [Facilitators](./references/facilitators.md) — Taiko facilitator URLs, USDC addresses, CAIP-2 identifiers
