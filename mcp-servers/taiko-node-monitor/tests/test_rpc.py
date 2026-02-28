"""Tests for rpc.py — all calls mocked, no live node required."""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from taiko_node_monitor.rpc import (
    get_node_health_data,
    get_sync_data,
    get_l1_block_number,
    rpc_call,
)

MOCK_L2_RPC = "http://localhost:8547"
MOCK_L1_RPC = "http://localhost:8545"


async def test_rpc_call_success():
    """rpc_call returns the result field on a successful response."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"jsonrpc": "2.0", "id": 1, "result": "0x28c58"}
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        result = await rpc_call(MOCK_L2_RPC, "eth_chainId")

    assert result == "0x28c58"


async def test_rpc_call_error_raises():
    """rpc_call raises RuntimeError when the RPC response contains an error."""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "jsonrpc": "2.0",
        "id": 1,
        "error": {"code": -32601, "message": "method not found"},
    }
    mock_response.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient") as mock_cls:
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(RuntimeError, match="RPC error"):
            await rpc_call(MOCK_L2_RPC, "nonexistent_method")


async def test_get_node_health_data_mainnet():
    """get_node_health_data returns correct structure and 'mainnet' network name."""
    rpc_responses: dict[str, object] = {
        "eth_chainId": "0x28c58",          # 167000 = mainnet
        "eth_blockNumber": "0x44B820",     # 4503584
        "eth_syncing": False,
        "net_peerCount": "0x12",           # 18 peers
        "web3_clientVersion": "taiko-geth/v1.17.4",
        "taiko_headL1Origin": {"l1BlockHeight": 22000000, "blockID": 4503584},
    }

    async def mock_rpc(url: str, method: str, params=None) -> object:
        return rpc_responses[method]

    with patch("taiko_node_monitor.rpc.rpc_call", side_effect=mock_rpc):
        result = await get_node_health_data(MOCK_L2_RPC, MOCK_L1_RPC)

    assert result["chain_id"] == 167000
    assert result["network"] == "mainnet"
    assert result["block_number"] == 4503584
    assert result["syncing"] is False
    assert result["peer_count"] == 18
    assert result["client_version"] == "taiko-geth/v1.17.4"
    assert result["l1_block_height_processed"] == 22000000


async def test_get_node_health_data_hoodi():
    """get_node_health_data identifies Hoodi testnet by chain ID 167013."""
    rpc_responses: dict[str, object] = {
        "eth_chainId": "0x28c65",          # 167013 = Hoodi
        "eth_blockNumber": "0x1000",
        "eth_syncing": False,
        "net_peerCount": "0x3",
        "web3_clientVersion": "taiko-geth/v1.17.4",
        "taiko_headL1Origin": {"l1BlockHeight": 1000000, "blockID": 4096},
    }

    async def mock_rpc(url: str, method: str, params=None) -> object:
        return rpc_responses[method]

    with patch("taiko_node_monitor.rpc.rpc_call", side_effect=mock_rpc):
        result = await get_node_health_data(MOCK_L2_RPC, MOCK_L1_RPC)

    assert result["chain_id"] == 167013
    assert result["network"] == "hoodi"


async def test_get_sync_data_fully_synced():
    """get_sync_data returns synced=True when eth_syncing is False."""

    async def mock_rpc(url: str, method: str, params=None) -> object:
        if method == "eth_syncing":
            return False
        if method == "eth_blockNumber":
            return "0x44B820"
        return None

    with patch("taiko_node_monitor.rpc.rpc_call", side_effect=mock_rpc):
        result = await get_sync_data(MOCK_L2_RPC, MOCK_L1_RPC)

    assert result["synced"] is True
    assert result["block_number"] == 4503584


async def test_get_sync_data_syncing_calculates_percentage():
    """get_sync_data calculates percentage and blocks_behind when node is syncing."""

    async def mock_rpc(url: str, method: str, params=None) -> object:
        if method == "eth_syncing":
            return {
                "currentBlock": "0x3D0900",   # 4000000
                "highestBlock": "0x44B820",   # 4503584
            }
        return None

    with patch("taiko_node_monitor.rpc.rpc_call", side_effect=mock_rpc):
        result = await get_sync_data(MOCK_L2_RPC, MOCK_L1_RPC)

    assert result["synced"] is False
    assert result["current_block"] == 4000000
    assert result["highest_block"] == 4503584
    assert result["blocks_behind"] == 503584
    assert 0 < result["percentage"] < 100


async def test_get_l1_block_number():
    """get_l1_block_number converts hex to int."""

    async def mock_rpc(url: str, method: str, params=None) -> object:
        return "0x14FB180"  # 22000000

    with patch("taiko_node_monitor.rpc.rpc_call", side_effect=mock_rpc):
        result = await get_l1_block_number(MOCK_L1_RPC)

    assert result == 22000000
