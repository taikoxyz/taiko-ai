# Deposit File Schema (v2)

The deposit file is secret material — treat it like a private key. Anyone with it can generate proofs, but claims always mint to the bound `recipient` address.

## Structure

```json
{
  "version": "v2",
  "chainId": "167013",
  "secret": "0x<64 hex chars — 32 random bytes>",
  "notes": [
    {
      "recipient": "0x<40 hex chars>",
      "amount": "<positive decimal integer string, in wei>",
      "label": "optional human label (max 64 chars)"
    }
  ],
  "targetAddress": "0x<40 hex chars>"
}
```

## Constraints

| Field | Constraint |
|-------|------------|
| `version` | Must be `"v2"` |
| `chainId` | Decimal string, e.g. `"167013"` |
| `secret` | `0x` + 64 hex chars (32 bytes) |
| `notes` | 1–5 items; total amount ≤ 8 ETH |
| `notes[].amount` | Positive decimal string, no leading zeros |
| `notes[].label` | Optional, max 64 chars (excluded from ZK derivation) |
| `targetAddress` | Optional; CLI validates it matches derivation if present |

## Target address derivation

```
notesHash     = SHA256(amounts[0..4 padded] || recipientHashes[0..4 padded])
targetAddress = last20bytes(SHA256("shadow.address.v1\0..." || chainId_bytes32 || secret_bytes32 || notesHash))
```

The target address has no known private key — ETH can only leave via the claim mechanism.

## Nullifier derivation (per note)

```
nullifier[i] = SHA256("shadow.nullifier.v1\0..." || chainId_bytes32 || secret_bytes32 || noteIndex_bytes32)
```

Nullifiers are published on-chain when a note is claimed, preventing double-claims.
