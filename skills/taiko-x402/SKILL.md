---
name: taiko-x402
description: Build and integrate x402 HTTP payment flows on Taiko using Taiko-operated facilitators. Use when adding per-request USDC payment gating to APIs deployed on Taiko (seller), building AI agents or clients that autonomously pay for x402 services (buyer), or configuring Taiko facilitators. Triggers: "x402", "HTTP payment", "pay per request", "monetize API", "USDC payment", "402 Payment Required", "facilitator.taiko.xyz", "paid API", "AI agent payments", "payment middleware".
---

# x402 Payments on Taiko

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

## References

- [Server setup](./references/server.md) — Express/Next.js/Hono middleware, route config, Bazaar discovery
- [Client setup](./references/client.md) — fetch/axios wrappers, wallet signer, USDC requirements
- [Facilitators](./references/facilitators.md) — Taiko facilitator URLs, USDC addresses, CAIP-2 identifiers
