# Node Troubleshooting

Common Taiko node errors and their solutions.

## Docker-Specific Issues

### Genesis header hash mismatch

**Error:** `Failed to ensure genesis block matched: genesis header hash mismatch`

**Cause:** Using the wrong docker-compose file for the network.

**Fix:** Use the correct file:
- Alethia: `docker compose up -d`
- Hoodi: `docker compose -f docker-compose-hoodi.yml up -d`

### Database contains incompatible genesis

**Cause:** Previously ran a different testnet.

**Fix:**
```bash
docker compose down -v   # Removes old volumes
```

### Error: no service selected

**Cause:** Outdated simple-taiko-node or missing `COMPOSE_PROFILES`.

**Fix:** Pull latest version and set `COMPOSE_PROFILES` in `.env`:
```bash
git pull origin main && docker compose pull
```

### Unknown shorthand flag: 'd' in -d

**Cause:** Using Docker Compose v1.

**Fix:** Use `docker-compose up -d` (with hyphen) or upgrade to [Docker Compose v2](https://docs.docker.com/compose/install/linux/).

### start-prover-relayer.sh: not found (Windows)

**Cause:** Windows line endings (CRLF).

**Fix:**
```bash
# Delete the node folder, then:
git config --global core.autocrlf false
git clone https://github.com/taikoxyz/simple-taiko-node.git
```

### Port already allocated

**Error:** `Bind for 0.0.0.0:6060 failed: port is already allocated`

**Fix:** Stop the conflicting service or change the port in `.env`.

## L1 Connection Issues

### Beacon client not found

**Error:** `Failed to decode tx list: beacon client not found`

**Cause:** Missing or incorrect `--l1.beacon` flag / `L1_BEACON_HTTP` env var.

**Fix:** Set `L1_BEACON_HTTP` in `.env` to your L1 beacon node URL.

### Block batch iterator callback error (reorg check)

**Error:** `failed to check whether L1 chain has been reorged`

**Cause:** L1 node is out of sync or lacks archive mode.

**Fix:**
1. Enable Archive feature on your RPC provider (e.g., Blockpi)
2. Or run your own L1 archive node

### Dial tcp: connect: connection refused

**Cause:** Cannot reach the RPC endpoint.

**Fix:** Check firewall rules:
```bash
sudo ufw status
```
Ensure the relevant ports are allowed.

### Dial tcp: lookup l2_execution_engine on 127.0.0.1:53: server misbehaving

**Cause:** L1 node issues — out of sync or rate-limited.

**Fix:**
1. Verify L1 node sync status
2. If rate-limited, increase limits or run your own L1 node

### No contract code at given address

**Cause:** Node on wrong network or L1 node still syncing.

**Fix:** Wait for L1 node to fully sync before starting the L2 node.

## P2P / Sync Issues

### Looking for peers (stuck)

**Fix:** Set `DISABLE_P2P_SYNC=true` in `.env` and restart. Then investigate P2P config.

### Low peer count (< 6 for Alethia, < 3 for Hoodi)

**Check:**
1. `PUBLIC_IP` is set correctly and reachable from the internet
2. TCP port `4001` is open
3. UDP port `30303` is open
4. `PRIV_RAW` is set (unique per node)

### Node not receiving preconfirmed blocks

**Check:**
1. `ENABLE_PRECONFS_P2P=true` in `.env`
2. P2P ports are open and reachable
3. Peer count is healthy (check `peer tick` in logs)

## Build Issues

### Caught SIGILL in blst_cgo_init

**Cause:** Older CPU with incompatible instruction set.

**Fix:**
```bash
export CGO_CFLAGS="-O -D__BLST_PORTABLE__"
export CGO_CFLAGS_ALLOW="-O -D__BLST_PORTABLE__"
```

## Prover Issues

### Required flag "l2.suggestedFeeRecipient" not set

**Cause:** Spaces in flag values in `.env` file.

**Fix:** Remove any spaces around `=` in `.env` fields.

### Block proposed but no proof request in Raiko

**Fix:**
1. Get the assigned block number from logs
2. `docker compose down` (do NOT use `-v`)
3. Set `PROVER_STARTING_BLOCK_ID=<block_number>` in `.env`
4. `docker compose up -d`
5. Check: `docker compose logs taiko_client_prover_relayer | grep "<block_number>"`

### Create EVM proof; Killed

**Cause:** Insufficient RAM.

**Fix:** Ensure machine meets minimum specs (16 GB RAM recommended).

## Ethereum Hoodi L1 (Fusaka Upgrade)

After the Fusaka upgrade, L1 beacon clients must run in supernode mode for blob availability:

| Client | Flag |
|--------|------|
| Lighthouse | `--semi-supernode` or `--supernode` |
| Teku | `--p2p-subscribe-all-custody-subnets-enabled` |
| Grandine | `--subscribe-all-data-column-subnets` |
| Lodestar | `--supernode` |
| Nimbus | `--debug-peerdas-supernode` |

Without this, your L2 node may experience blob unavailability or chain divergence.

## Getting Help

If none of the above solutions work:
- Check logs: `docker compose logs -f`
- Visit [Taiko Discord](https://discord.gg/aGZYtKqMjj) — Node Operators channel
- Check [docs](https://docs.taiko.xyz/guides/node-operators/node-troubleshooting/)
