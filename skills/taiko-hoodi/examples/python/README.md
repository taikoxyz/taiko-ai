# Python Examples for Taiko Hoodi

Python utilities for interacting with Taiko Hoodi.

## Setup

```bash
# Install dependencies (optional - scripts fall back to Foundry's cast)
pip install -r requirements.txt
```

## Examples

### calc_blockhash.py

Calculates and verifies block hashes for Taiko Hoodi blocks.

Demonstrates:
- Fetching block headers via RPC
- RLP encoding of Shanghai block headers
- Keccak256 hashing
- Verifying block hash matches header hash

```bash
python calc_blockhash.py
```

Output:
```
Block number: 4642864
RPC block.hash: 0x...
keccak(headerRlp): 0x...
hash matches header keccak
```

### verify_signal.py

Demonstrates signal verification using merkle proofs.

Demonstrates:
- Computing signal storage slots
- Fetching storage proofs via `eth_getProof`
- Verifying signals exist in SignalService

```bash
python verify_signal.py
```

## Notes

- Scripts use Taiko Hoodi RPC: `https://rpc.hoodi.taiko.xyz`
- If `pysha3` is not installed, scripts fall back to Foundry's `cast keccak`
- Install Foundry: https://book.getfoundry.sh/getting-started/installation
