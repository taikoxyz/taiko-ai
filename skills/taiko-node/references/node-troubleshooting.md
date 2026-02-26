# Node Troubleshooting

## Docker Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Genesis header hash mismatch | Wrong compose file | Mainnet: `docker compose up -d`, Hoodi: `docker compose -f docker-compose-hoodi.yml up -d` |
| Incompatible genesis DB | Old testnet data | `docker compose down -v` |
| No service selected | Missing `COMPOSE_PROFILES` | Set in `.env`; run `git pull origin main && docker compose pull` |
| Flag `-d` unknown | Docker Compose v1 | Use `docker-compose up -d` or upgrade to v2 |
| start-prover-relayer.sh not found | Windows CRLF | `git config --global core.autocrlf false` then re-clone |
| Port already allocated | Conflicting service | Change port in `.env` or stop other service |

## L1 Connection Issues

| Error | Cause | Fix |
|-------|-------|-----|
| Beacon client not found | Missing `L1_BEACON_HTTP` | Set in `.env` to L1 beacon URL |
| L1 reorg check failed | L1 out of sync / no archive | Enable archive on RPC provider or run own L1 node |
| Connection refused | Firewall blocking | `sudo ufw status` — allow ports |
| l2_execution_engine DNS misbehaving | L1 sync issues / rate-limited | Check L1 sync status; run local L1 |
| No contract code at address | Wrong network or L1 still syncing | Wait for L1 to fully sync |

## P2P / Sync Issues

| Issue | Fix |
|-------|-----|
| Stuck "Looking for peers" | Set `DISABLE_P2P_SYNC=true`, restart, investigate P2P config |
| Low peer count | Verify: `PUBLIC_IP` reachable, TCP 4001 open, UDP 30303 open, `PRIV_RAW` set |
| No preconfirmed blocks | Set `ENABLE_PRECONFS_P2P=true`, verify ports + peer count via `peer tick` logs |

## Build Issues

| Error | Fix |
|-------|-----|
| SIGILL in blst_cgo_init | `export CGO_CFLAGS="-O -D__BLST_PORTABLE__"` and `CGO_CFLAGS_ALLOW="-O -D__BLST_PORTABLE__"` |

## Prover Issues

| Issue | Fix |
|-------|-----|
| l2.suggestedFeeRecipient not set | Remove spaces around `=` in `.env` |
| EVM proof killed | Needs 16 GB+ RAM |
| Block proposed, no proof in Raiko | `docker compose down` (no `-v`), set `PROVER_STARTING_BLOCK_ID=<block>` in `.env`, restart |

## Hoodi L1 Fusaka Beacon Flags

Required for blob availability after Fusaka upgrade:

| Client | Flag |
|--------|------|
| Lighthouse | `--semi-supernode` or `--supernode` |
| Teku | `--p2p-subscribe-all-custody-subnets-enabled` |
| Grandine | `--subscribe-all-data-column-subnets` |
| Lodestar | `--supernode` |
| Nimbus | `--debug-peerdas-supernode` |

## Help

- Logs: `docker compose logs -f`
- Discord: https://discord.gg/aGZYtKqMjj
- Docs: https://docs.taiko.xyz/guides/node-operators/node-troubleshooting/
