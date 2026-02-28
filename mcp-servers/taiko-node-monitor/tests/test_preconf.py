"""Tests for preconf.py — no filesystem side effects beyond tempdir."""

from __future__ import annotations

import tempfile
from pathlib import Path

from taiko_node_monitor.preconf import (
    SAFE_ENV_KEYS,
    SENSITIVE_PATTERNS,
    get_preconf_status,
    parse_env_file,
    parse_preconf_peer_count,
)


def test_parse_env_file_returns_safe_keys():
    """parse_env_file returns only whitelisted, non-sensitive keys."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text(
            "ENABLE_PRECONFS_P2P=true\n"
            "PUBLIC_IP=1.2.3.4\n"
            "P2P_TCP_PORT=4001\n"
            "PRIV_RAW=0xdeadbeef\n"  # must be filtered (PRIV pattern)
            "L1_ENDPOINT_WS=ws://...\n"  # not in SAFE_ENV_KEYS
            "CHAIN_ID=167000\n"
        )

        result = parse_env_file(tmpdir)

    assert result["ENABLE_PRECONFS_P2P"] == "true"
    assert result["PUBLIC_IP"] == "1.2.3.4"
    assert result["CHAIN_ID"] == "167000"
    assert "PRIV_RAW" not in result
    assert "L1_ENDPOINT_WS" not in result


def test_parse_env_file_comments_and_blank_lines_ignored():
    """parse_env_file skips comments (#) and blank lines."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text("# This is a comment\n\nCHAIN_ID=167000\n  \n")
        result = parse_env_file(tmpdir)

    assert result == {"CHAIN_ID": "167000"}


def test_parse_env_file_missing_returns_empty():
    """parse_env_file returns {} when .env does not exist."""
    with tempfile.TemporaryDirectory() as tmpdir:
        result = parse_env_file(tmpdir)

    assert result == {}


def test_parse_preconf_peer_count_returns_last():
    """parse_preconf_peer_count returns the last peersLen value in the log."""
    log = "peersLen=3 connecting\nother line\npeersLen=5 connected\npeersLen=7 stable"
    assert parse_preconf_peer_count(log) == 7


def test_parse_preconf_peer_count_none_when_absent():
    """parse_preconf_peer_count returns None when no peersLen found."""
    assert parse_preconf_peer_count("no peer info here") is None


def test_get_preconf_status_healthy_mainnet():
    """get_preconf_status returns healthy for mainnet with >= 6 peers."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text(
            "ENABLE_PRECONFS_P2P=true\nPUBLIC_IP=5.5.5.5\nP2P_TCP_PORT=4001\nP2P_UDP_PORT=30303\nCHAIN_ID=167000\n"
        )

        result = get_preconf_status(tmpdir, "peersLen=6 healthy")

    assert result["preconfs_enabled"] is True
    assert result["public_ip_configured"] is True
    assert result["peer_count"] == 6
    assert result["peer_health"] == "healthy"
    assert result["network"] == "mainnet"
    assert "warnings" not in result


def test_get_preconf_status_degraded_low_peers():
    """get_preconf_status marks degraded and adds warning when peers < min."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text("ENABLE_PRECONFS_P2P=true\nPUBLIC_IP=5.5.5.5\nCHAIN_ID=167000\n")

        result = get_preconf_status(tmpdir, "peersLen=2")

    assert result["peer_health"] == "degraded"
    assert "warnings" in result
    assert any("2 < 6" in w for w in result["warnings"])


def test_get_preconf_status_warns_missing_public_ip():
    """get_preconf_status warns when PUBLIC_IP is empty and preconfs are enabled."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text("ENABLE_PRECONFS_P2P=true\nPUBLIC_IP=\nCHAIN_ID=167000\n")

        result = get_preconf_status(tmpdir, "peersLen=8")

    assert "warnings" in result
    assert any("PUBLIC_IP" in w for w in result["warnings"])


def test_get_preconf_status_hoodi_lower_threshold():
    """Hoodi testnet uses min_recommended_peers=3, not 6."""
    with tempfile.TemporaryDirectory() as tmpdir:
        Path(tmpdir, ".env").write_text("ENABLE_PRECONFS_P2P=true\nPUBLIC_IP=1.1.1.1\nCHAIN_ID=167013\n")

        result = get_preconf_status(tmpdir, "peersLen=4")

    assert result["min_recommended_peers"] == 3
    assert result["peer_health"] == "healthy"
    assert result["network"] == "hoodi"


def test_sensitive_patterns_block_private_key_variants():
    """SENSITIVE_PATTERNS rejects all forms of private key / secret env vars."""
    should_block = ["PRIV_RAW", "PRIVATE_KEY", "API_SECRET", "AUTH_TOKEN", "PASSWORD"]
    for key in should_block:
        assert SENSITIVE_PATTERNS.search(key), f"{key} should be blocked"


def test_safe_env_keys_does_not_contain_sensitive_words():
    """None of the SAFE_ENV_KEYS should match SENSITIVE_PATTERNS."""
    for key in SAFE_ENV_KEYS:
        assert not SENSITIVE_PATTERNS.search(key), f"SAFE_ENV_KEYS contains sensitive key: {key}"
