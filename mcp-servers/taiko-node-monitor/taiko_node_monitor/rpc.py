"""Taiko JSON-RPC helpers."""

from __future__ import annotations

import httpx


async def rpc_call(url: str, method: str, params: list | None = None) -> object:
    """Make a JSON-RPC 2.0 call and return the result."""
    if params is None:
        params = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            url,
            json={"jsonrpc": "2.0", "method": method, "params": params, "id": 1},
        )
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            err = data["error"]
            raise RuntimeError(f"RPC error {err.get('code', '')}: {err.get('message', str(err))}")
        return data["result"]


async def get_node_health_data(l2_rpc: str, l1_rpc: str) -> dict:
    """Gather node health metrics: chain ID, block number, sync status, peers, version."""
    chain_id_hex = await rpc_call(l2_rpc, "eth_chainId")
    chain_id = int(chain_id_hex, 16)

    block_number_hex = await rpc_call(l2_rpc, "eth_blockNumber")
    block_number = int(block_number_hex, 16)

    syncing = await rpc_call(l2_rpc, "eth_syncing")

    peer_count_hex = await rpc_call(l2_rpc, "net_peerCount")
    peer_count = int(peer_count_hex, 16)

    client_version = await rpc_call(l2_rpc, "web3_clientVersion")

    # Best-effort: get the L1 block height the node has processed
    l1_block_height: int | None = None
    try:
        l1_origin = await rpc_call(l2_rpc, "taiko_headL1Origin")
        raw = l1_origin.get("l1BlockHeight")
        if isinstance(raw, int):
            l1_block_height = raw
        elif isinstance(raw, str):
            l1_block_height = int(raw, 16) if raw.startswith("0x") else int(raw)
        else:
            l1_block_height = None
    except Exception:
        pass

    return {
        "chain_id": chain_id,
        "network": "mainnet" if chain_id == 167000 else ("hoodi" if chain_id == 167013 else "unknown"),
        "block_number": block_number,
        "syncing": syncing,
        "peer_count": peer_count,
        "client_version": client_version,
        "l1_block_height_processed": l1_block_height,
    }


async def get_sync_data(l2_rpc: str, l1_rpc: str) -> dict:
    """Get sync progress percentage and blocks behind head."""
    syncing = await rpc_call(l2_rpc, "eth_syncing")

    if syncing is False:
        block_number_hex = await rpc_call(l2_rpc, "eth_blockNumber")
        return {
            "synced": True,
            "block_number": int(block_number_hex, 16),
        }

    current = int(syncing["currentBlock"], 16)
    highest = int(syncing["highestBlock"], 16)
    percentage = round(current / highest * 100, 2) if highest > 0 else 0.0

    return {
        "synced": False,
        "current_block": current,
        "highest_block": highest,
        "percentage": percentage,
        "blocks_behind": highest - current,
    }


async def get_l1_block_number(l1_rpc: str) -> int:
    """Get the latest L1 block number."""
    hex_block = await rpc_call(l1_rpc, "eth_blockNumber")
    return int(hex_block, 16)
