"""Tests for docker_ops.py — all Docker calls mocked, no daemon required."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from taiko_node_monitor.docker_ops import FRIENDLY_NAMES, SERVICES


def test_services_dict_has_correct_labels():
    """SERVICES contains the exact service names from simple-taiko-node docker-compose.yml."""
    assert "l2_execution_engine" in SERVICES
    assert "taiko_client_driver" in SERVICES
    # Values match the com.docker.compose.service label values
    assert SERVICES["l2_execution_engine"] == "l2_execution_engine"
    assert SERVICES["taiko_client_driver"] == "taiko_client_driver"


def test_friendly_names_populated():
    """FRIENDLY_NAMES has human-readable descriptions for all services."""
    for key in SERVICES:
        assert key in FRIENDLY_NAMES
        assert len(FRIENDLY_NAMES[key]) > 0


def test_find_container_success():
    """find_container returns the first container matching the Compose service label."""
    from taiko_node_monitor.docker_ops import find_container

    mock_container = MagicMock()
    mock_client = MagicMock()
    mock_client.containers.list.return_value = [mock_container]

    result = find_container(mock_client, "l2_execution_engine")

    mock_client.containers.list.assert_called_once_with(
        filters={"label": "com.docker.compose.service=l2_execution_engine"}
    )
    assert result is mock_container


def test_find_container_not_found_returns_none():
    """find_container returns None when no container matches the label."""
    from taiko_node_monitor.docker_ops import find_container

    mock_client = MagicMock()
    mock_client.containers.list.return_value = []

    result = find_container(mock_client, "l2_execution_engine")
    assert result is None


def test_find_container_unknown_service_raises():
    """find_container raises ValueError for an unrecognised service name."""
    from taiko_node_monitor.docker_ops import find_container

    with pytest.raises(ValueError, match="Unknown service"):
        find_container(MagicMock(), "nonexistent_service")


def test_get_service_status_running():
    """get_service_status returns running=True for a running container."""
    from taiko_node_monitor.docker_ops import get_service_status

    mock_container = MagicMock()
    mock_container.status = "running"
    mock_container.name = "simple-taiko-node-l2_execution_engine-1"
    mock_container.image.tags = ["us-docker.pkg.dev/evmchain/images/taiko-geth:v1.17.4"]

    with patch("taiko_node_monitor.docker_ops.find_container", return_value=mock_container):
        result = get_service_status(MagicMock(), "l2_execution_engine")

    assert result["running"] is True
    assert result["status"] == "running"
    assert result["service"] == "l2_execution_engine"


def test_get_service_status_not_found():
    """get_service_status returns running=False when the container is not found."""
    from taiko_node_monitor.docker_ops import get_service_status

    with patch("taiko_node_monitor.docker_ops.find_container", return_value=None):
        result = get_service_status(MagicMock(), "l2_execution_engine")

    assert result["running"] is False
    assert result["status"] == "not_found"


def test_get_logs_applies_filter():
    """get_logs returns only lines matching the filter (case-insensitive)."""
    from taiko_node_monitor.docker_ops import get_logs

    mock_container = MagicMock()
    mock_container.logs.return_value = (
        b"2024 INFO normal operation\n2024 ERROR something went wrong\n2024 INFO more normal stuff\n"
    )

    with (
        patch("taiko_node_monitor.docker_ops.get_docker_client") as mock_get_client,
        patch("taiko_node_monitor.docker_ops.find_container", return_value=mock_container),
    ):
        mock_get_client.return_value = MagicMock()
        result = get_logs("l2_execution_engine", lines=100, filter_text="error")

    assert "ERROR something went wrong" in result
    assert "normal operation" not in result
    assert "more normal stuff" not in result


def test_get_logs_no_filter_returns_all_lines():
    """get_logs returns all lines when no filter is specified."""
    from taiko_node_monitor.docker_ops import get_logs

    mock_container = MagicMock()
    mock_container.logs.return_value = b"line1\nline2\nline3\n"

    with (
        patch("taiko_node_monitor.docker_ops.get_docker_client") as mock_get_client,
        patch("taiko_node_monitor.docker_ops.find_container", return_value=mock_container),
    ):
        mock_get_client.return_value = MagicMock()
        result = get_logs("l2_execution_engine", lines=100)

    assert "line1" in result
    assert "line2" in result
    assert "line3" in result


def test_get_logs_caps_at_500():
    """get_logs passes at most 500 to container.logs(tail=...)."""
    from taiko_node_monitor.docker_ops import get_logs

    mock_container = MagicMock()
    mock_container.logs.return_value = b"some log\n"

    with (
        patch("taiko_node_monitor.docker_ops.get_docker_client") as mock_get_client,
        patch("taiko_node_monitor.docker_ops.find_container", return_value=mock_container),
    ):
        mock_get_client.return_value = MagicMock()
        get_logs("l2_execution_engine", lines=9999)

    mock_container.logs.assert_called_once_with(tail=500, timestamps=True)
