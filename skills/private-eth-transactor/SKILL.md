---
name: private-eth-transactor
description: Use when performing privacy-preserving ETH transfers on Taiko using the Shadow protocol. Covers deposit creation, target address funding, ZK proof generation, and on-chain claiming via the Shadow server REST API or CLI.
---

# Shadow — Private ETH Transfer on Taiko

Shadow is a privacy-preserving ETH claim system on Taiko L2. An agent deposits ETH to a deterministically-derived "target address" on L1 Ethereum, then claims on Taiko L2 using a ZK proof — without linking depositor and recipient.

## Four-Stage Lifecycle

```
Create deposit → Fund target address (L1) → Generate ZK proof → Claim on L2
```

**Important constraints:**
- Notes: 1–5 per deposit file
- Total amount: ≤ 8 ETH across all notes
- Protocol fee: 0.1% deducted per claim
- Deposit file = secret material — losing it means losing the ETH

---

## Mode 1: Server (Docker) — Recommended

The Shadow server exposes a REST API for deposit management, proof generation, and claim calldata. All steps are fully scriptable.

### Start the server

```bash
# Pull and run (auto-selects port 3000–3099)
curl -fsSL https://raw.githubusercontent.com/taikoxyz/shadow/main/start.sh | sh

# Or, if you've cloned the shadow repo
./start.sh

# Force latest image
./start.sh --pull
```

Server is ready when `http://localhost:3000/api/health` returns `200`.

### Stage 1: Create deposit

```bash
curl -X POST http://localhost:3000/api/deposits \
  -H 'Content-Type: application/json' \
  -d '{
    "chainId": "167013",
    "notes": [
      { "recipient": "0xRECIPIENT", "amount": "1000000000000000000", "label": "1 ETH note" }
    ]
  }'
```

Response includes `id` (deposit ID) and `targetAddress`. Save both.

For multiple notes (splitting the transfer):
```bash
# Two notes of 0.5 ETH each to different recipients
-d '{
  "chainId": "167013",
  "notes": [
    { "recipient": "0xALICE", "amount": "500000000000000000" },
    { "recipient": "0xBOB",   "amount": "500000000000000000" }
  ]
}'
```

### Stage 2: Fund target address

Send ETH to `targetAddress` on **L1 Ethereum** (plain transfer — no contract call needed).

```bash
# Hoodi testnet L1
cast send <targetAddress> --value <totalAmountWei> \
  --rpc-url https://rpc.hoodi.ethpandaops.io \
  --private-key $FUNDER_KEY
```

Then **wait** for the L1 state root to be checkpointed on Taiko L2 (~few minutes on Hoodi). The Shadow server polls for this automatically during proving.

### Stage 3: Generate ZK proof

Proof generation uses RISC Zero Groth16 and requires **Docker running**.

```bash
# Start proof generation (async)
curl -X POST http://localhost:3000/api/deposits/{id}/prove

# Poll until all notes are proved (check notes[*].status == "proved")
until curl -s http://localhost:3000/api/deposits/{id} \
  | jq -e '[.notes[].status] | all(. == "proved")' > /dev/null; do
  sleep 30
done
```

### Stage 4: Claim on L2

```bash
# Get the claim calldata for a specific note
curl http://localhost:3000/api/deposits/{id}/notes/0/claim-tx
# Returns: { "to": "0x...", "data": "0x...", "value": "0" }

# Submit via cast (claimer pays gas on L2; ETH mints to the note's recipient)
cast send <to> <data> \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $CLAIMER_KEY
```

The claimer address does not need to hold the deposit funds. ETH is minted directly to the note's `recipient`.

---

## Mode 2: CLI (shadowcli.mjs)

Use when the Shadow server is not available. Requires the shadow repo cloned with Node.js + Rust + Docker.

```bash
# One-time: build the prover binary
node packages/risc0-prover/scripts/install-cli.mjs

# Create deposit
node packages/risc0-prover/scripts/mine-deposit.mjs \
  --out deposits/my-deposit.json \
  --chain-id 167013 \
  --recipient 0xRECIPIENT \
  --amount-wei 1000000000000000000 \
  --note-count 1

# Validate deposit file (prints targetAddress, no network call)
node packages/risc0-prover/scripts/shadowcli.mjs validate \
  --deposit deposits/my-deposit.json

# Prove all notes
node packages/risc0-prover/scripts/shadowcli.mjs prove-all \
  --deposit deposits/my-deposit.json

# Claim all notes
node packages/risc0-prover/scripts/shadowcli.mjs claim-all \
  --deposit deposits/my-deposit.json \
  --private-key $CLAIMER_KEY
```

---

## Server API Quick Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Server config (addresses, circuit ID) |
| GET | `/api/deposits` | List all deposits |
| GET | `/api/deposits/:id` | Deposit details + note statuses |
| POST | `/api/deposits` | Create deposit |
| DELETE | `/api/deposits/:id` | Delete deposit file |
| POST | `/api/deposits/:id/prove` | Start proof generation |
| DELETE | `/api/deposits/:id/proof` | Delete proof file |
| GET | `/api/deposits/:id/notes/:idx/claim-tx` | Get claim calldata |
| POST | `/api/deposits/:id/notes/:idx/refresh` | Refresh on-chain claim status |
| GET | `/api/queue` | Proof queue status |
| WS | `/ws` | Real-time events |

---

## Chain & Contract Reference

See [contracts reference](./references/contracts.md) for all deployed addresses.

| Network | L2 Chain ID | L1 Chain ID | L2 RPC |
|---------|-------------|-------------|--------|
| Taiko Hoodi | 167013 | 560048 (Hoodi) | `https://rpc.hoodi.taiko.xyz` |
| Taiko Mainnet | 167000 | 1 (Ethereum) | `https://rpc.mainnet.taiko.xyz` |

---

## Deposit File Schema

```json
{
  "version": "v2",
  "chainId": "167013",
  "secret": "0x<64 hex chars>",
  "notes": [
    {
      "recipient": "0x<40 hex chars>",
      "amount": "<wei as decimal string>",
      "label": "optional label (max 64 chars)"
    }
  ],
  "targetAddress": "0x<40 hex chars>"
}
```

**The `secret` field is sensitive.** Anyone with it can generate proofs, but claims always go to the bound `recipient` address.

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `insufficient balance: X < Y` | Target address not funded or checkpoint not yet processed | Fund on L1, wait a few minutes |
| `nullifier already consumed` | Note was already claimed | Skip; check other notes |
| `host binary not found` | CLI prover not built | `node packages/risc0-prover/scripts/install-cli.mjs` |
| `Please install docker first` | Docker not running | Start Docker daemon |
| `RPC chainId mismatch` | Wrong L1 RPC URL | Use L1 RPC matching deposit's `chainId` |
| `DEPOSIT schema validation failed` | Malformed deposit file | Check schema above |

---

## Security

- The target address has no known private key — ETH can only leave via the claim mechanism
- Never commit deposit files or private keys to version control
- Back up deposit files: loss = inability to claim
- Shadow provides privacy properties but does not guarantee full anonymity (see shadow repo `PRIVACY.md`)
