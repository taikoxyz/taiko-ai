"""Preconfirmation node status helpers."""

from __future__ import annotations

import re
from pathlib import Path

# Keys from simple-taiko-node .env that are safe to expose to the LLM
SAFE_ENV_KEYS: frozenset[str] = frozenset({
    "ENABLE_PRECONFS_P2P",
    "PUBLIC_IP",
    "P2P_TCP_PORT",
    "P2P_UDP_PORT",
    "COMPOSE_PROFILES",
    "PROVER_STARTING_BLOCK_ID",
    "DISABLE_P2P_SYNC",
    "CHAIN_ID",
    "MAXPEERS",
    "VERBOSITY",
})

# Never expose keys matching these patterns (private keys, secrets, endpoints)
SENSITIVE_PATTERNS = re.compile(
    r"(PRIV|KEY|SECRET|TOKEN|PASSWORD|PRIVATE|MNEMONIC|SEED|ENDPOINT|WS|HTTP)",
    re.IGNORECASE,
)


def parse_env_file(compose_dir: str) -> dict[str, str]:
    """Parse .env file from simple-taiko-node, returning only safe keys."""
    env_path = Path(compose_dir) / ".env"
    if not env_path.exists():
        return {}

    result: dict[str, str] = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if key in SAFE_ENV_KEYS and not SENSITIVE_PATTERNS.search(key):
            result[key] = value.strip()

    return result


def parse_preconf_peer_count(log_text: str) -> int | None:
    """Extract the most recent peersLen value from taiko-client driver logs."""
    matches = re.findall(r"peersLen=(\d+)", log_text)
    return int(matches[-1]) if matches else None


def get_preconf_status(compose_dir: str, log_text: str = "") -> dict:
    """
    Get preconfirmation configuration and peer health status.

    Reads safe keys from .env in compose_dir and parses peer count from log_text.
    """
    env = parse_env_file(compose_dir)

    enabled = env.get("ENABLE_PRECONFS_P2P", "true").lower() not in ("false", "0")
    public_ip = env.get("PUBLIC_IP", "").strip()
    p2p_tcp_port = env.get("P2P_TCP_PORT", "4001")
    p2p_udp_port = env.get("P2P_UDP_PORT", "30303")
    chain_id = int(env.get("CHAIN_ID", "167000"))

    peer_count = parse_preconf_peer_count(log_text)

    # Mainnet needs more peers than Hoodi testnet
    min_peers = 6 if chain_id == 167000 else 3

    peer_health: str
    if peer_count is None:
        peer_health = "unknown"
    elif peer_count >= min_peers:
        peer_health = "healthy"
    else:
        peer_health = "degraded"

    status: dict = {
        "preconfs_enabled": enabled,
        "public_ip_configured": bool(public_ip),
        "public_ip": public_ip or "(not set)",
        "p2p_tcp_port": p2p_tcp_port,
        "p2p_udp_port": p2p_udp_port,
        "peer_count": peer_count,
        "peer_health": peer_health,
        "min_recommended_peers": min_peers,
        "network": "mainnet" if chain_id == 167000 else ("hoodi" if chain_id == 167013 else "unknown"),
    }

    warnings: list[str] = []
    if enabled and not public_ip:
        warnings.append("PUBLIC_IP is not set — other nodes cannot discover this preconfirmer")
    if peer_count is not None and peer_count < min_peers:
        warnings.append(
            f"Low peer count ({peer_count} < {min_peers} recommended for "
            f"{'mainnet' if chain_id == 167000 else 'Hoodi'})"
        )
    if warnings:
        status["warnings"] = warnings

    return status
