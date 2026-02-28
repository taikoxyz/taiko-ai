"""taiko-node-monitor: FastMCP server entry point."""

from __future__ import annotations

import os
from typing import Literal

from fastmcp import FastMCP

from .docker_ops import (
    SERVICES,
    get_all_logs,
    get_logs,
    get_service_status,
    restart_service_async,
    get_docker_client,
)
from .preconf import get_preconf_status
from .rpc import get_l1_block_number, get_node_health_data, get_sync_data, rpc_call

mcp = FastMCP(
    "taiko-node-monitor",
    instructions=(
        "Monitor and manage a local Taiko node running via simple-taiko-node Docker Compose. "
        "Provides health checks, sync progress, peer counts, log access, and service restarts. "
        "Requires Docker socket access and a locally running Taiko node. "
        "Service names: 'l2_execution_engine' (taiko-geth), 'taiko_client_driver' (taiko-client)."
    ),
)

TAIKO_RPC_URL = os.getenv("TAIKO_RPC", "http://localhost:8547")
L1_RPC_URL = os.getenv("L1_RPC", "http://localhost:8545")
COMPOSE_DIR = os.getenv("COMPOSE_DIR", os.path.expanduser("~/simple-taiko-node"))


@mcp.tool()
async def get_node_health() -> dict:
    """
    Get overall node health: chain ID, network name, current block number,
    sync status, P2P peer count, client version, and latest L1 block processed.
    """
    return await get_node_health_data(TAIKO_RPC_URL, L1_RPC_URL)


@mcp.tool()
async def get_sync_progress() -> dict:
    """
    Get sync progress. Returns synced=true with block_number when fully synced,
    or synced=false with current_block, highest_block, percentage, and blocks_behind.
    """
    return await get_sync_data(TAIKO_RPC_URL, L1_RPC_URL)


@mcp.tool()
async def get_peer_count() -> dict:
    """
    Get the number of P2P peers connected to the Taiko node.
    Returns count and a 'healthy' flag (true if >= 6 peers for mainnet).
    """
    peer_count_hex = await rpc_call(TAIKO_RPC_URL, "net_peerCount")
    count = int(peer_count_hex, 16)
    return {"count": count, "healthy": count >= 6}


@mcp.tool()
async def check_l1_connection() -> dict:
    """
    Check L1 RPC connectivity. Returns the latest L1 block number, sync status,
    and client version string. Use to verify the node's L1 endpoint is reachable.
    """
    block_number = await get_l1_block_number(L1_RPC_URL)
    syncing = await rpc_call(L1_RPC_URL, "eth_syncing")
    client_version = await rpc_call(L1_RPC_URL, "web3_clientVersion")
    return {
        "connected": True,
        "block_number": block_number,
        "syncing": syncing is not False,
        "client_version": client_version,
        "rpc_url": L1_RPC_URL,
    }


@mcp.tool()
async def get_node_logs(
    service: str = "all",
    lines: int = 100,
    filter: str | None = None,
) -> str:
    """
    Get recent logs from node containers.
    service: 'l2_execution_engine' (taiko-geth), 'taiko_client_driver' (taiko-client), or 'all'
    lines: number of lines to return (max 500)
    filter: optional case-insensitive grep filter (e.g. 'ERROR', 'syncing')
    """
    if service == "all":
        return get_all_logs(lines=lines, filter_text=filter)
    elif service in SERVICES:
        return get_logs(service=service, lines=lines, filter_text=filter)
    else:
        valid = ", ".join(SERVICES.keys())
        raise ValueError(f"Unknown service '{service}'. Valid: {valid}, all")


@mcp.tool()
async def restart_service(
    service: Literal["l2_execution_engine", "taiko_client_driver", "all"],
) -> dict:
    """
    Restart a Taiko node service via Docker.
    WARNING: Interrupts block production during restart (~10s grace period).
    service: 'l2_execution_engine' (taiko-geth), 'taiko_client_driver' (taiko-client), or 'all'
    """
    return await restart_service_async(service)


@mcp.tool()
async def get_preconf_node_status() -> dict:
    """
    Get preconfirmation node configuration and peer health.
    Reads ENABLE_PRECONFS_P2P, PUBLIC_IP, and P2P port settings from the .env file
    in COMPOSE_DIR, and parses peer count from recent taiko-client logs.
    """
    # Parse peer count from recent taiko_client_driver logs
    try:
        logs = get_logs(service="taiko_client_driver", lines=200, filter_text="peersLen")
    except Exception:
        logs = ""

    return get_preconf_status(COMPOSE_DIR, logs)


def main() -> None:
    """Entry point for uvx / pip install."""
    mcp.run()


if __name__ == "__main__":
    main()
