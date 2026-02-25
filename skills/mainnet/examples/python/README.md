# Python Examples

Utilities for Taiko Alethia mainnet. Falls back to Foundry's `cast` if dependencies unavailable.

## calc_blockhash.py

Calculate and verify block hashes via RLP encoding + keccak256.

```bash
python calc_blockhash.py
# Output: Block number, RPC hash, computed hash, match status
```

## verify_signal.py

Verify signals using merkle proofs via `eth_getProof`.

```bash
python verify_signal.py
```

## Setup

```bash
pip install -r requirements.txt  # Optional - scripts use cast fallback
```

RPC: `https://rpc.mainnet.taiko.xyz`
