# Shadow CLI (shadowcli.mjs)

Use when the Shadow server is not available. Requires the shadow repo cloned with Node.js + Rust + Docker.

> **Always pass `--shadow 0x77cdA0575e66A5FC95404fdA856615AD507d8A07`** when claiming on Hoodi — the CLI's hardcoded default address is outdated.

## Setup

```bash
# One-time: install Node.js dependencies and build the prover binary
cd packages/risc0-prover && npm install
node scripts/install-cli.mjs
```

## Create a deposit (mine-deposit.mjs)

```bash
node packages/risc0-prover/scripts/mine-deposit.mjs \
  --out deposits/my-deposit.json \
  --chain-id 167013 \
  --recipient 0xRECIPIENT \
  --amount-wei 1000000000000000000 \
  --note-count 1
```

| Flag | Required | Description |
|------|----------|-------------|
| `--out` | yes | Output path for deposit JSON |
| `--chain-id` | yes | `167013` (Hoodi) or `167000` (Mainnet) |
| `--recipient` | yes | Recipient address (20-byte hex) |
| `--amount-wei` | yes | Amount per note in wei |
| `--note-count` | no | Number of notes, default: 2, max: 5 |

## shadowcli.mjs subcommands

### validate
Derives and prints `targetAddress` + nullifiers without any network calls.
```bash
node packages/risc0-prover/scripts/shadowcli.mjs validate \
  --deposit deposits/my-deposit.json
```

### prove / prove-all
```bash
# Single note
node packages/risc0-prover/scripts/shadowcli.mjs prove \
  --deposit deposits/my-deposit.json \
  --note-index 0

# All notes sequentially
node packages/risc0-prover/scripts/shadowcli.mjs prove-all \
  --deposit deposits/my-deposit.json
```

Key flags: `--rpc <url>`, `--receipt-kind groth16` (default), `--verbose`, `--proof-out <path>`

### claim / claim-all
```bash
# Single note
node packages/risc0-prover/scripts/shadowcli.mjs claim \
  --proof deposits/note-0.proof.json \
  --shadow 0x77cdA0575e66A5FC95404fdA856615AD507d8A07 \
  --private-key $CLAIMER_KEY

# All notes (skips already-claimed)
node packages/risc0-prover/scripts/shadowcli.mjs claim-all \
  --deposit deposits/my-deposit.json \
  --shadow 0x77cdA0575e66A5FC95404fdA856615AD507d8A07 \
  --private-key $CLAIMER_KEY
```

Key flags: `--rpc <url>` (default: `https://rpc.hoodi.taiko.xyz`)
