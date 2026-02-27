# x402 Client Setup — Buyer Guide

Call payment-protected APIs from code. The client wrapper intercepts 402 responses, signs an EIP-712 USDC authorization, and retries automatically.

## Prerequisites

- EVM wallet with USDC on Taiko Mainnet (`eip155:167000`) or Hoodi (`eip155:167013`)
- Private key or CDP wallet credentials

## Install

```bash
# fetch-based (recommended)
npm install @x402/fetch @x402/evm

# axios-based
npm install @x402/axios @x402/evm

# Go
go get github.com/coinbase/x402/go

# Python
pip install "x402[httpx,evm]"      # async (recommended)
pip install "x402[requests,evm]"   # sync
```

## TypeScript — fetch wrapper

```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("https://your-api.example.com/api/data");
const data = await response.json();
```

## TypeScript — Axios

Import from `@x402/axios` instead; same signer/scheme registration as fetch above:

```typescript
import { wrapAxiosWithPayment, x402Client } from "@x402/axios";
const api = wrapAxiosWithPayment(axios.create({ baseURL: url }), client);
```

## Go

```go
import (
    "log"
    "net/http"
    "os"

    x402 "github.com/coinbase/x402/go"
    x402http "github.com/coinbase/x402/go/http"
    evmclient "github.com/coinbase/x402/go/mechanisms/evm/exact/client"
    evmsigner "github.com/coinbase/x402/go/signers/evm"
)

signer, err := evmsigner.NewClientSignerFromPrivateKey(os.Getenv("EVM_PRIVATE_KEY"))
if err != nil {
    log.Fatal(err)
}

client := x402.Newx402Client()
client.Register("eip155:*", evmclient.NewExactEvmScheme(signer))

httpX402 := x402http.Newx402HTTPClient(client)
httpClient := x402http.WrapHTTPClientWithPayment(http.DefaultClient, httpX402)

resp, err := httpClient.Get("https://your-api.example.com/api/data")
if err != nil {
    log.Fatal(err)
}
_ = resp // use resp as needed
```

## Python

```python
import asyncio, os
from eth_account import Account
from x402 import x402Client
from x402.http.clients import x402HttpxClient
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact.register import register_exact_evm_client

async def main():
    client = x402Client()
    account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
    register_exact_evm_client(client, EthAccountSigner(account))

    async with x402HttpxClient(client) as http:
        response = await http.get("https://your-api.example.com/api/data")
        print(response.text)

asyncio.run(main())
```

**Sync variant:** Use `x402ClientSync` + `x402_requests` context manager instead of `x402Client` + `x402HttpxClient`. Import from the same `x402.http.clients` module.

## Getting USDC on Taiko

**Mainnet:** Bridge USDC from Ethereum via https://bridge.taiko.xyz

**Hoodi:** Get L1 test ETH from a faucet (see `taiko:references/networks.md`), bridge via https://bridge.hoodi.taiko.xyz, swap to USDC.

## Error Handling

```typescript
try {
  const response = await fetchWithPayment(url);
  const data = await response.json();
} catch (error) {
  if (error.message.includes("No scheme registered")) {
    // Network not configured — add registerExactEvmScheme for the right CAIP-2
  } else if (error.message.includes("Payment already attempted")) {
    // Facilitator rejected — check USDC balance and allowance
  } else if (error.message.includes("insufficient funds")) {
    // Not enough USDC in wallet
  }
}
```

## Discovering Services (Bazaar)

```bash
# List discoverable x402 services (if facilitator supports Bazaar)
curl -s https://facilitator.taiko.xyz/discovery/resources
```
