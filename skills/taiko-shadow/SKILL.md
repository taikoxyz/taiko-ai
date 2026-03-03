---
name: taiko-shadow
description: Use when performing private or anonymous ETH transfers on Taiko. Covers deposit creation, target address funding, ZK proof generation, and on-chain claiming via REST API or CLI.
---

# Shadow — Private ETH Transfer on Taiko

Shadow is a privacy-preserving ETH claim system on Taiko L2. An agent deposits ETH to a deterministically-derived "target address" on L1 Ethereum, then claims on Taiko L2 using a ZK proof — without linking depositor and recipient.

> **Network Selection:** If the user has not specified "hoodi" or "mainnet", always ask which network to use before proceeding.

> **No pool required.** Unlike mixers, Shadow uses ZK proofs per deposit — a single user can privately transfer ETH without waiting for others to participate.

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

## MCP Tools for Lifecycle Verification

| Step | Tool | Purpose |
|------|------|---------|
| Before deposit | `get_balance` | Verify source address has enough ETH on L1 |
| After funding | `get_transaction_info` | Confirm L1 funding tx is confirmed |
| During prove | `get_bridge_message_status` | Track cross-chain relay status |
| Before new deposit | `get_pending_messages` | Check for stuck prior deposits |
| Before claim | `get_gas_price` | Estimate L2 claim tx cost |

## CLI Quick Reference

```bash
taiko bridge status <TX_HASH> --json    # check bridge relay for L1 funding tx
taiko bridge history <ADDRESS> --json   # list all bridge deposits for an address
```

## Deposit Lifecycle Tracking

Use `TaskCreate` / `TaskUpdate` to persist `deposit_id` across session interruptions:
- Create task at deposit creation, include `deposit_id` and `targetAddress` in description
- Update task after each step (fund, prove, claim)
- On resume: `TaskList` → find `in_progress` shadow deposits → extract `deposit_id`

## Related Skills

- **Network RPC endpoints:** [taiko/references/networks.md](../taiko/references/networks.md)
- **Bridge relay context:** [taiko/references/bridge-interface.md](../taiko/references/bridge-interface.md)

## Security

- Deposit file = secret — never commit or log it; loss = unrecoverable ETH
- The target address has no known private key; ETH can only leave via claim
- Shadow provides privacy but does not guarantee full anonymity
