# Taiko x402 Facilitators

## Facilitator Endpoints

| Facilitator | Networks | Notes |
|-------------|----------|-------|
| `https://facilitator.taiko.xyz` | Taiko Mainnet + Hoodi | Primary — use for all deployments |
| `https://x402.taiko.xyz` | Taiko Mainnet only | Alternative for mainnet |

## CAIP-2 Network Identifiers

| Network | Chain ID | CAIP-2 |
|---------|----------|--------|
| Taiko Mainnet | 167000 | `eip155:167000` |
| Taiko Hoodi | 167013 | `eip155:167013` |

Use these CAIP-2 identifiers everywhere `network` is specified in x402 route config and client setup.

## USDC Contract Addresses

| Network | USDC Address |
|---------|-------------|
| Taiko Mainnet | Verify at https://taikoscan.io (search "USDC") |
| Taiko Hoodi | Verify at https://hoodi.taikoscan.io (search "USDC") |

> USDC on Taiko is bridged from Ethereum. Confirm the contract address before deploying — do not hardcode without verifying on the explorer.

To get USDC for testing on Hoodi:
1. Get test ETH from the Hoodi L1 faucet (see taiko:references/networks.md)
2. Bridge ETH to Taiko Hoodi at https://bridge.hoodi.taiko.xyz
3. Swap ETH → USDC via a DEX on Hoodi, or use a Hoodi USDC faucet if available

## Configuring the Taiko Facilitator in Code

### TypeScript

```typescript
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { x402ResourceServer } from "@x402/express";

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://facilitator.taiko.xyz",
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:167000", new ExactEvmScheme())   // Mainnet
  .register("eip155:167013", new ExactEvmScheme());  // Hoodi
```

### Go

```go
import (
    x402http "github.com/coinbase/x402/go/http"
    evm "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
)

facilitatorClient := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
    URL: "https://facilitator.taiko.xyz",
})
// Register both networks
schemes := []ginmw.SchemeConfig{
    {Network: "eip155:167000", Server: evm.NewExactEvmScheme()},
    {Network: "eip155:167013", Server: evm.NewExactEvmScheme()},
}
```

### Python

```python
from x402.http import FacilitatorConfig, HTTPFacilitatorClient
from x402.mechanisms.evm.exact import ExactEvmServerScheme
from x402.server import x402ResourceServer

facilitator = HTTPFacilitatorClient(
    FacilitatorConfig(url="https://facilitator.taiko.xyz")
)
server = x402ResourceServer(facilitator)
server.register("eip155:167000", ExactEvmServerScheme())  # Mainnet
server.register("eip155:167013", ExactEvmServerScheme())  # Hoodi
```

## Verifying the Facilitator

Check that the facilitator is reachable and returns valid config:

```bash
# Health check (if endpoint exists)
curl -s https://facilitator.taiko.xyz/health

# Test a verify call (should return 400 with validation error, not 404/502)
curl -s -X POST https://facilitator.taiko.xyz/verify \
  -H 'Content-Type: application/json' \
  -d '{"x402Version":2}'
```
