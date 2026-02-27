# Shadow Server — Docker Setup & REST API

## Start the server

```bash
# Pull and run (auto-selects port 3000–3099)
curl -fsSL https://raw.githubusercontent.com/taikoxyz/shadow/main/start.sh | sh

# Or from the cloned shadow repo
./start.sh
```

Server is ready when `GET http://localhost:3000/api/health` returns `200`.

**Minimum Docker resources:** 4 CPUs, 8 GB RAM, 10 GB disk.

### start.sh flags

| Flag | Description |
|------|-------------|
| `--pull` | Force pull latest image from registry |
| `--build` | Build image from source |
| `--clean` | Remove all shadow images/containers and exit |
| `--clear-cache` | Remove Docker BuildKit cache and exit |
| `--benchmark` | Monitor CPU/memory during proving, write metrics to workspace |
| `--memory SIZE` | Container memory limit (default: `8g`) |
| `--cpus N` | Container CPU limit (default: `4`) |
| `--verbose [LEVEL]` | Server log verbosity: `info` (default), `debug`, `trace` |
| `--prove FILE` | Prove a deposit file directly — no server started (headless mode) |
| `--output PATH` | Output path for proof when using `--prove` |
| `[PORT]` | Pin to a specific port (default: first free in 3000–3099) |

### `--prove` headless mode

Prove a deposit file without starting the full server — useful for scripted pipelines:

```bash
./start.sh --prove deposits/my-deposit.json --output /tmp/proofs/
```

---

## Stage 1: Create deposit

```bash
curl -s -X POST http://localhost:3000/api/deposits \
  -H 'Content-Type: application/json' \
  -d '{
    "chainId": "167013",
    "notes": [
      { "recipient": "0xRECIPIENT", "amount": "1000000000000000000" }
    ]
  }'
# Response: { "id": "...", "targetAddress": "0x...", "totalAmount": "..." }
```

Multiple notes (split transfer across recipients):
```bash
"notes": [
  { "recipient": "0xALICE", "amount": "500000000000000000" },
  { "recipient": "0xBOB",   "amount": "500000000000000000" }
]
```

## Stage 2: Fund target address

Send ETH to `targetAddress` on **L1 Ethereum** (plain transfer — no contract interaction):

```bash
cast send <targetAddress> --value <totalAmountWei> \
  --rpc-url https://rpc.hoodi.ethpandaops.io \
  --private-key $FUNDER_KEY
```

Wait for the L1 state root to be checkpointed on Taiko L2 (~few minutes on Hoodi). The server polls for this automatically during proving.

## Stage 3: Generate ZK proof

Requires **Docker running**. Proof generation is async.

```bash
# Start proving; add ?force=true to overwrite an existing proof
curl -s -X POST http://localhost:3000/api/deposits/{id}/prove

# Poll until all notes are proved
until curl -s http://localhost:3000/api/deposits/{id} \
  | jq -e '[.notes[].status] | all(. == "proved")' > /dev/null; do
  sleep 30
done
```

## Stage 4: Claim on L2

```bash
# Get claim calldata for note index 0
CLAIM=$(curl -s http://localhost:3000/api/deposits/{id}/notes/0/claim-tx)
# Returns: { "to": "0x...", "data": "0x...", "chainId": "0x..." }

# Submit claim on Taiko L2 (claimer pays gas; ETH mints to the note's recipient)
cast send $(echo $CLAIM | jq -r '.to') $(echo $CLAIM | jq -r '.data') \
  --rpc-url https://rpc.hoodi.taiko.xyz \
  --private-key $CLAIMER_KEY
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/config` | Server config (addresses, circuit ID) |
| GET | `/api/deposits` | List all deposits |
| GET | `/api/deposits/:id` | Deposit details + note statuses |
| POST | `/api/deposits` | Create deposit |
| DELETE | `/api/deposits/:id` | Delete deposit file |
| POST | `/api/deposits/:id/prove` | Start proof generation (`?force=true` to overwrite) |
| DELETE | `/api/deposits/:id/proof` | Delete proof file |
| GET | `/api/deposits/:id/notes/:idx/claim-tx` | Get claim calldata |
| GET | `/api/deposits/:id/notes/:idx/status` | On-chain claim status (`unclaimed`\|`claimed`\|`unknown`) |
| POST | `/api/deposits/:id/notes/:idx/refresh` | Force refresh on-chain claim status |
| GET | `/api/queue` | Proof queue status |
| DELETE | `/api/queue/current` | Cancel current proof job |
| WS | `/ws` | Real-time events (`workspace:changed`, `queue:update`) |
