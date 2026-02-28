"""Tests for server.py tool helpers."""

from __future__ import annotations

import sys
import types
from unittest.mock import AsyncMock, patch

import pytest

# Stub fastmcp so server module can be imported in minimal test envs.
fastmcp_stub = types.ModuleType("fastmcp")


class _DummyFastMCP:
    def __init__(self, *_args, **_kwargs):
        pass

    def tool(self):
        def decorator(func):
            return func

        return decorator

    def run(self):
        return None


fastmcp_stub.FastMCP = _DummyFastMCP
sys.modules.setdefault("fastmcp", fastmcp_stub)


@pytest.mark.asyncio
async def test_get_peer_count_mainnet_defaults():
    """Mainnet uses the default threshold of 6 peers."""

    async def mock_rpc(_url: str, method: str, _params=None):
        if method == "eth_chainId":
            return "0x28c58"  # 167000
        if method == "net_peerCount":
            return "0x6"  # 6
        raise AssertionError(f"Unexpected RPC method: {method}")

    from taiko_node_monitor.server import get_peer_count

    with patch("taiko_node_monitor.server.rpc_call", side_effect=mock_rpc):
        result = await get_peer_count()

    assert result["network"] == "mainnet"
    assert result["count"] == 6
    assert result["min_recommended_peers"] == 6
    assert result["healthy"] is True


@pytest.mark.asyncio
async def test_get_peer_count_hoodi_env_override():
    """Hoodi threshold can be overridden with TAIKO_MIN_PEERS_TESTNET."""
    with (
        patch.dict("os.environ", {"TAIKO_MIN_PEERS_TESTNET": "5"}, clear=False),
        patch("taiko_node_monitor.server.rpc_call", new_callable=AsyncMock) as rpc_mock,
    ):
        from taiko_node_monitor.server import get_peer_count

        rpc_mock.side_effect = ["0x28c65", "0x4"]  # chainId=167013, peers=4
        result = await get_peer_count()

    assert result["network"] == "hoodi"
    assert result["count"] == 4
    assert result["min_recommended_peers"] == 5
    assert result["healthy"] is False
