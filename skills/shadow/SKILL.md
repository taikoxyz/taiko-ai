---
name: shadow
description: Use when performing private or anonymous ETH transfers on Taiko. Covers deposit creation, target address funding, ZK proof generation, and on-chain claiming via REST API or CLI.
---

# Shadow — Private ETH Transfer on Taiko

Shadow is a privacy-preserving ETH claim system on Taiko L2. An agent deposits ETH to a deterministically-derived "target address" on L1 Ethereum, then claims on Taiko L2 using a ZK proof — without linking depositor and recipient.

## Lifecycle

```
Create deposit → Fund target address (L1) → Generate ZK proof → Claim on L2
```

**Constraints:** 1–5 notes per deposit, total ≤ 8 ETH, 0.1% protocol fee per claim.

## Quick Decision

| Situation | Use |
|-----------|-----|
| Default / automated pipeline | [Server (REST API)](./references/server.md) |
| No Docker server available | [CLI (shadowcli.mjs)](./references/cli.md) |
| Scripted proving only | `start.sh --prove FILE` (see server reference) |

## References

- [Server & REST API](./references/server.md) — start.sh flags, 4-stage workflow, full API table
- [CLI](./references/cli.md) — shadowcli.mjs subcommands, mine-deposit flags
- [Deposit Schema](./references/deposit-schema.md) — v2 JSON schema, derivation formulas
- [Contracts](./references/contracts.md) — deployed addresses, circuit ID, cast queries

## Common Errors

| Error | Fix |
|-------|-----|
| `insufficient balance: X < Y` | Fund target on L1, wait for checkpoint, retry |
| `nullifier already consumed` | Note already claimed — skip, check others |
| `Please install docker first` | Start Docker daemon |
| `RPC chainId mismatch` | Use L1 RPC matching deposit's `chainId` |
| `DEPOSIT schema validation failed` | See [deposit schema](./references/deposit-schema.md) |
| Server not responding | Re-run `start.sh` |

## Security

- Deposit file = secret — never commit or log it; loss = unrecoverable ETH
- The target address has no known private key; ETH can only leave via claim
- Shadow provides privacy but does not guarantee full anonymity
