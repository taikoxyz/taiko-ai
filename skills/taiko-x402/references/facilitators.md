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

For USDC on Hoodi testnet, see [client setup — Getting USDC](./client.md#getting-usdc-on-taiko).

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
    ginmw "github.com/coinbase/x402/go/http/gin"
    evmserver "github.com/coinbase/x402/go/mechanisms/evm/exact/server"
)

facilitator := x402http.NewHTTPFacilitatorClient(&x402http.FacilitatorConfig{
    URL: "https://facilitator.taiko.xyz",
})

schemes := []ginmw.SchemeConfig{
    {Network: "eip155:167000", Server: evmserver.NewExactEvmScheme()},
    {Network: "eip155:167013", Server: evmserver.NewExactEvmScheme()},
}
```

### Python

Same pattern — see [server.md FastAPI example](./server.md#fastapi-python) for full setup. Key imports: `from x402.http import FacilitatorConfig, HTTPFacilitatorClient` and `from x402.mechanisms.evm.exact import ExactEvmServerScheme`.

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
