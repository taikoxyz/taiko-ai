#!/usr/bin/env python3
"""
Utility to compare Taiko Hoodi RPC block.hash vs keccak256(RLP(header)).
Shanghai-only header encoding for Hoodi/Shasta.

Optional dependency: pip install pysha3
Fallback hashing path: `cast keccak` if `pysha3` is unavailable.
"""

import json
import subprocess
from typing import Union
import urllib.request

RPC = "https://rpc.hoodi.taiko.xyz"
BLOCK_HEX = "0x46d830"  # 4642864

try:
    from sha3 import keccak_256  # type: ignore
except ImportError:
    keccak_256 = None


def qty_to_int(value: str) -> int:
    """Parse an RPC quantity (0x-prefixed) into an integer."""
    if not isinstance(value, str) or not value.startswith("0x"):
        raise TypeError(f"Expected quantity hex string, got: {value!r}")
    return int(value, 16)


def hex_bytes(value: str) -> bytes:
    """Parse hex data (0x-prefixed) into bytes."""
    if not isinstance(value, str) or not value.startswith("0x"):
        raise TypeError(f"Expected data hex string, got: {value!r}")
    body = value[2:]
    if len(body) % 2 == 1:
        body = "0" + body
    return bytes.fromhex(body) if body else b""


def int_to_min_bytes(value: int) -> bytes:
    """Convert integer to minimal big-endian bytes; zero maps to empty bytes."""
    if value < 0:
        raise ValueError("RLP integer cannot be negative")
    if value == 0:
        return b""
    out = bytearray()
    while value:
        out.append(value & 0xFF)
        value >>= 8
    return bytes(reversed(out))


def enc_len(length: int, offset: int) -> bytes:
    """Encode RLP length prefix for string/list payloads."""
    if length < 56:
        return bytes([length + offset])
    len_bytes = int_to_min_bytes(length)
    return bytes([len(len_bytes) + offset + 55]) + len_bytes


def rlp(item: Union[int, bytes, list]) -> bytes:
    """RLP-encode integers, bytes, or lists of encodable items."""
    if isinstance(item, list):
        payload = b"".join(rlp(x) for x in item)
        return enc_len(len(payload), 0xC0) + payload

    if isinstance(item, int):
        payload = int_to_min_bytes(item)
    elif isinstance(item, bytes):
        payload = item
    else:
        raise TypeError(f"Unsupported RLP item type: {type(item)}")

    if len(payload) == 1 and payload[0] < 0x80:
        return payload
    return enc_len(len(payload), 0x80) + payload


def keccak256_hex(payload: bytes) -> str:
    """Compute Keccak-256 and return 0x-prefixed hex."""
    if keccak_256 is not None:
        return "0x" + keccak_256(payload).hexdigest()

    try:
        out = subprocess.check_output(
            ["cast", "keccak", "0x" + payload.hex()],
            text=True,
        ).strip()
    except FileNotFoundError as exc:
        raise SystemExit(
            "pysha3 is not installed and `cast` was not found. "
            "Install pysha3 (`pip install pysha3`) or Foundry cast."
        ) from exc
    except subprocess.CalledProcessError as exc:
        raise SystemExit(f"Failed to compute keccak via cast: {exc}") from exc

    return out if out.startswith("0x") else "0x" + out


def require_field(block: dict, key: str) -> str:
    """Fetch a required header key and fail fast if absent."""
    value = block.get(key)
    if value is None:
        raise SystemExit(f"Missing required Shanghai header field: {key}")
    return value


def shanghai_header_fields(block: dict) -> list:
    """Return Shanghai header fields in canonical hash order."""
    return [
        hex_bytes(require_field(block, "parentHash")),
        hex_bytes(require_field(block, "sha3Uncles")),
        hex_bytes(require_field(block, "miner")),
        hex_bytes(require_field(block, "stateRoot")),
        hex_bytes(require_field(block, "transactionsRoot")),
        hex_bytes(require_field(block, "receiptsRoot")),
        hex_bytes(require_field(block, "logsBloom")),
        qty_to_int(require_field(block, "difficulty")),
        qty_to_int(require_field(block, "number")),
        qty_to_int(require_field(block, "gasLimit")),
        qty_to_int(require_field(block, "gasUsed")),
        qty_to_int(require_field(block, "timestamp")),
        hex_bytes(require_field(block, "extraData")),
        hex_bytes(require_field(block, "mixHash")),
        hex_bytes(require_field(block, "nonce")),
        qty_to_int(require_field(block, "baseFeePerGas")),
        hex_bytes(require_field(block, "withdrawalsRoot")),
    ]


def main() -> None:
    """Load a Hoodi header and compare RPC hash to local header-hash computation."""
    req = urllib.request.Request(
        RPC,
        data=json.dumps(
            {
                "jsonrpc": "2.0",
                "method": "eth_getHeaderByNumber",
                "params": [BLOCK_HEX],
                "id": 1,
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())

    block = data.get("result")
    if not block:
        raise SystemExit(f"Block {BLOCK_HEX} not found")

    fields = shanghai_header_fields(block)
    header_rlp = rlp(fields)
    computed = keccak256_hex(header_rlp).lower()
    rpc_hash = require_field(block, "hash").lower()

    print("Block number:", int(require_field(block, "number"), 16))
    print("RPC block.hash:", rpc_hash)
    print("keccak(headerRlp):", computed)
    if rpc_hash != computed:
        print(">>> mismatch detected <<<")
    else:
        print("hash matches header keccak")


if __name__ == "__main__":
    main()