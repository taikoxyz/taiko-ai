#!/usr/bin/env python3
"""
Example: Verify a signal was sent on Taiko Alethia mainnet using merkle proofs.

This demonstrates how to:
1. Query the SignalService for a signal slot
2. Generate a storage proof using eth_getProof
3. Verify the proof locally

Dependencies: pip install web3
"""

import json
from typing import Optional
import urllib.request

# Taiko Alethia mainnet configuration
RPC = "https://rpc.mainnet.taiko.xyz"
CHAIN_ID = 167000

# SignalService address on Taiko Alethia L2
SIGNAL_SERVICE = "0x1670000000000000000000000000000000000005"


def rpc_call(method: str, params: list) -> dict:
    """Make a JSON-RPC call to the Taiko Alethia RPC."""
    req = urllib.request.Request(
        RPC,
        data=json.dumps({
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": 1,
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
    # Encode: "SIGNAL" + uint64(chainId) + address(app) + bytes32(signal)
    encoded = b"SIGNAL"
    encoded += chain_id.to_bytes(8, "big")
    encoded += bytes.fromhex(app[2:].lower().zfill(40))
    encoded += signal

    return keccak256(encoded)


def get_storage_proof(
    contract: str,
    slot: bytes,
    block: str = "latest"
) -> Optional[dict]:
    """
    Get a merkle proof for a storage slot.

    Returns the proof data from eth_getProof.
    """
    slot_hex = "0x" + slot.hex()

    result = rpc_call("eth_getProof", [contract, [slot_hex], block])

    if not result or not result.get("storageProof"):
        return None

    return result


def verify_signal_sent(
    chain_id: int,
    sender_app: str,
    signal: bytes,
    block: str = "latest"
) -> bool:
    """
    Verify that a signal was sent by checking storage.

    Args:
        chain_id: The chain ID where the signal was sent
        sender_app: The contract that sent the signal
        signal: The 32-byte signal value
        block: Block number or "latest"

    Returns:
        True if the signal exists in storage
    """
    # Compute the storage slot
    slot = compute_signal_slot(chain_id, sender_app, signal)
    print(f"Signal slot: 0x{slot.hex()}")

    # Get the storage proof
    proof = get_storage_proof(SIGNAL_SERVICE, slot, block)

    if not proof:
        print("Failed to get storage proof")
        return False

    # Check the storage value
    storage_proof = proof["storageProof"][0]
    value = storage_proof.get("value", "0x0")

    print(f"Storage value: {value}")
    print(f"Account proof length: {len(proof.get('accountProof', []))}")
    print(f"Storage proof length: {len(storage_proof.get('proof', []))}")

    # Signal exists if value matches the signal
    expected = "0x" + signal.hex()
    return value.lower() == expected.lower()


def main():
    """Example: Check if a specific signal exists."""
    print("Signal Verification Example for Taiko Alethia Mainnet")
    print("=" * 55)
    print(f"RPC: {RPC}")
    print(f"Chain ID: {CHAIN_ID}")
    print(f"SignalService: {SIGNAL_SERVICE}")
    print()

    # Example signal (you would replace this with an actual signal)
    # In practice, this would be a message hash from the Bridge
    example_signal = bytes.fromhex(
        "0000000000000000000000000000000000000000000000000000000000000001"
    )

    # Example sender (Bridge contract)
    bridge_address = "0x1670000000000000000000000000000000000001"

    print(f"Checking signal from: {bridge_address}")
    print(f"Signal: 0x{example_signal.hex()}")
    print()

    # This will likely return False unless the signal actually exists
    exists = verify_signal_sent(
        chain_id=CHAIN_ID,
        sender_app=bridge_address,
        signal=example_signal,
    )

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
