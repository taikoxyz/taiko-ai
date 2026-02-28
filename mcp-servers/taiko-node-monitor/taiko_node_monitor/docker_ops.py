"""Docker SDK integration for simple-taiko-node containers."""

from __future__ import annotations

import asyncio
from typing import Optional

import docker
import docker.errors

# Docker Compose service names from taikoxyz/simple-taiko-node docker-compose.yml
SERVICES: dict[str, str] = {
    "l2_execution_engine": "l2_execution_engine",   # taiko-geth
    "taiko_client_driver": "taiko_client_driver",   # taiko-client (driver mode)
}

FRIENDLY_NAMES: dict[str, str] = {
    "l2_execution_engine": "taiko-geth (L2 execution engine)",
    "taiko_client_driver": "taiko-client (driver)",
}


def get_docker_client() -> docker.DockerClient:
    """Get Docker client (respects DOCKER_HOST env var)."""
    try:
        return docker.from_env()
    except docker.errors.DockerException as e:
        raise RuntimeError(
            f"Cannot connect to Docker: {e}. "
            "Ensure Docker is running and the socket is accessible."
        ) from e


def find_container(
    client: docker.DockerClient, service: str
) -> Optional[docker.models.containers.Container]:
    """Find a running container by its Docker Compose service label."""
    label_value = SERVICES.get(service)
    if label_value is None:
        valid = ", ".join(SERVICES.keys())
        raise ValueError(f"Unknown service '{service}'. Valid: {valid}, all")

    containers = client.containers.list(
        filters={"label": f"com.docker.compose.service={label_value}"}
    )
    return containers[0] if containers else None


def get_service_status(client: docker.DockerClient, service: str) -> dict:
    """Return the status of a single service container."""
    container = find_container(client, service)
    if not container:
        return {"service": service, "status": "not_found", "running": False}

    container.reload()
    return {
        "service": service,
        "friendly_name": FRIENDLY_NAMES.get(service, service),
        "name": container.name,
        "status": container.status,
        "running": container.status == "running",
        "image": container.image.tags[0] if container.image.tags else "unknown",
    }


async def restart_service_async(service: str) -> dict:
    """Restart one or all node services. Returns per-service results."""
    if service not in SERVICES and service != "all":
        valid = ", ".join(SERVICES.keys())
        raise ValueError(f"Unknown service '{service}'. Valid: {valid}, all")

    loop = asyncio.get_event_loop()
    client = get_docker_client()
    services = list(SERVICES.keys()) if service == "all" else [service]

    results = []
    for svc in services:
        container = find_container(client, svc)
        if not container:
            results.append({"service": svc, "error": "container not found"})
            continue

        await loop.run_in_executor(None, container.restart, 10)
        container.reload()
        results.append({
            "service": svc,
            "friendly_name": FRIENDLY_NAMES.get(svc, svc),
            "status": container.status,
            "warning": "Service interrupted — block production paused during restart",
        })

    return {"results": results}


def get_logs(
    service: str,
    lines: int = 100,
    filter_text: str | None = None,
) -> str:
    """Get recent logs from a service container (max 500 lines, optional grep filter)."""
    client = get_docker_client()
    container = find_container(client, service)
    if not container:
        return f"Container for service '{service}' not found."

    raw = container.logs(tail=min(lines, 500), timestamps=True)
    text = raw.decode("utf-8", errors="replace")

    if filter_text:
        filtered = [
            line for line in text.splitlines()
            if filter_text.lower() in line.lower()
        ]
        text = "\n".join(filtered)

    friendly = FRIENDLY_NAMES.get(service, service)
    return f"=== {friendly} ===\n{text}"


def get_all_logs(lines: int = 100, filter_text: str | None = None) -> str:
    """Get logs from all node services, combined with section headers."""
    parts = [get_logs(svc, lines, filter_text) for svc in SERVICES]
    return "\n\n".join(parts)
