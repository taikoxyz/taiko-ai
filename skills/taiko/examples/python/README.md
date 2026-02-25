# Python Examples

Utilities for Taiko networks. Falls back to Foundry's `cast` if dependencies unavailable.

## calc_blockhash.py

Calculate and verify block hashes via RLP encoding + keccak256.

```bash
# Set target network RPC
export TAIKO_RPC=https://rpc.hoodi.taiko.xyz  # or https://rpc.mainnet.taiko.xyz
python calc_blockhash.py
```

## verify_signal.py

Verify signals using merkle proofs via `eth_getProof`.

```bash
export TAIKO_RPC=https://rpc.hoodi.taiko.xyz
python verify_signal.py
```

## Setup

```bash
pip install -r requirements.txt  # Optional - scripts use cast fallback
```
