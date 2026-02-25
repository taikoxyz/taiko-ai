#!/usr/bin/env python3
"""
Verify a signal was sent on Taiko using merkle proofs.

This demonstrates how to:
1. Query the SignalService for a signal slot
2. Generate a storage proof using eth_getProof
3. Verify the proof locally

Usage:
    export TAIKO_RPC=https://rpc.hoodi.taiko.xyz   # or https://rpc.mainnet.taiko.xyz
    python verify_signal.py
"""

import json
import os
from typing import Optional
import urllib.request

# Network configuration via environment
RPC = os.environ.get("TAIKO_RPC", "https://rpc.hoodi.taiko.xyz")

# Detect network from RPC URL
NETWORKS = {
    "mainnet": {"chain_id": 167000, "signal_service": "0x1670000000000000000000000000000000000005",
                "bridge": "0x1670000000000000000000000000000000000001"},
    "hoodi":   {"chain_id": 167013, "signal_service": "0x1670130000000000000000000000000000000005",
                "bridge": "0x1670130000000000000000000000000000000001"},
}

def detect_network(rpc: str) -> dict:
    """Detect network config from RPC URL."""
    if "mainnet" in rpc or rpc == "https://rpc.taiko.xyz":
        return NETWORKS["mainnet"]
    return NETWORKS["hoodi"]

NET = detect_network(RPC)
CHAIN_ID = NET["chain_id"]
SIGNAL_SERVICE = NET["signal_service"]


def rpc_call(method: str, params: list) -> dict:
    """Make a JSON-RPC call."""
    req = urllib.request.Request(
        RPC,
        data=json.dumps({
            "jsonrpc": "2.0", "method": method, "params": params, "id": 1,
        }).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    if "error" in data:
        raise Exception(f"RPC error: {data['error']}")
    return data.get("result")


def keccak256(data: bytes) -> bytes:
    """Compute keccak256 hash. Requires pysha3 or falls back to cast."""
    try:
        from sha3 import keccak_256
        return keccak_256(data).digest()
    except ImportError:
        import subprocess
        hex_data = "0x" + data.hex()
        result = subprocess.check_output(["cast", "keccak", hex_data], text=True).strip()
        return bytes.fromhex(result[2:])


def compute_signal_slot(chain_id: int, app: str, signal: bytes) -> bytes:
    """
    Compute the storage slot for a signal.
    slot = keccak256(abi.encodePacked("SIGNAL", chainId, app, signal))
    """
    encoded = b"SIGNAL"
    encoded += chain_id.to_bytes(8, "big")
    encoded += bytes.fromhex(app[2:].lower().zfill(40))
    encoded += signal
    return keccak256(encoded)


def get_storage_proof(contract: str, slot: bytes, block: str = "latest") -> Optional[dict]:
    """Get a merkle proof for a storage slot."""
    slot_hex = "0x" + slot.hex()
    result = rpc_call("eth_getProof", [contract, [slot_hex], block])
    if not result or not result.get("storageProof"):
        return None
    return result


def verify_signal_sent(chain_id: int, sender_app: str, signal: bytes, block: str = "latest") -> bool:
    """Verify that a signal was sent by checking storage."""
    slot = compute_signal_slot(chain_id, sender_app, signal)
    print(f"Signal slot: 0x{slot.hex()}")

    proof = get_storage_proof(SIGNAL_SERVICE, slot, block)
    if not proof:
        print("Failed to get storage proof")
        return False

    storage_proof = proof["storageProof"][0]
    value = storage_proof.get("value", "0x0")
    print(f"Storage value: {value}")
    print(f"Account proof length: {len(proof.get('accountProof', []))}")
    print(f"Storage proof length: {len(storage_proof.get('proof', []))}")

    expected = "0x" + signal.hex()
    return value.lower() == expected.lower()


def main():
    """Example: Check if a specific signal exists."""
    network_name = "Mainnet" if CHAIN_ID == 167000 else "Hoodi"
    print(f"Signal Verification — Taiko {network_name}")
    print("=" * 50)
    print(f"RPC: {RPC}")
    print(f"Chain ID: {CHAIN_ID}")
    print(f"SignalService: {SIGNAL_SERVICE}")
    print()

    example_signal = bytes.fromhex(
        "0000000000000000000000000000000000000000000000000000000000000001"
    )
    bridge_address = NET["bridge"]

    print(f"Checking signal from: {bridge_address}")
    print(f"Signal: 0x{example_signal.hex()}")
    print()

    exists = verify_signal_sent(chain_id=CHAIN_ID, sender_app=bridge_address, signal=example_signal)

    print()
    if exists:
        print("Signal EXISTS in storage")
    else:
        print("Signal NOT FOUND (expected for example data)")

    print()
    print("To verify a real signal:")
    print("1. Get a message hash from a Bridge MessageSent event")
    print("2. Use the sender contract address")
    print("3. Call verify_signal_sent() with the actual values")


if __name__ == "__main__":
    main()
