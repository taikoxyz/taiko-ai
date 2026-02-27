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
pip install "x402[httpx]"      # async (recommended)
pip install "x402[requests]"   # sync
pip install eth_account         # wallet signer
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

// Payment handled automatically — no 402 visible to caller
const response = await fetchWithPayment("https://your-api.example.com/api/data");
const data = await response.json();
```

## TypeScript — Axios

```typescript
import { wrapAxiosWithPayment, x402Client } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const api = wrapAxiosWithPayment(
  axios.create({ baseURL: "https://your-api.example.com" }),
  client,
);

const response = await api.get("/api/data");
console.log(response.data);
```

## Go

```go
import (
    "net/http"
    "os"

    x402 "github.com/coinbase/x402/go"
    x402http "github.com/coinbase/x402/go/http"
    evmclient "github.com/coinbase/x402/go/mechanisms/evm/exact/client"
    evmsigner "github.com/coinbase/x402/go/signers/evm"
)

signer, err := evmsigner.NewClientSignerFromPrivateKey(os.Getenv("EVM_PRIVATE_KEY"))

client := x402.Newx402Client()
client.Register("eip155:*", evmclient.NewExactEvmScheme(signer))

httpX402 := x402http.Newx402HTTPClient(client)
httpClient := x402http.WrapHTTPClientWithPayment(http.DefaultClient, httpX402)

resp, err := httpClient.Get("https://your-api.example.com/api/data")
```

## Python (async with httpx)

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

## Python (sync with requests)

```python
import os
from eth_account import Account
from x402 import x402ClientSync
from x402.http.clients import x402_requests
from x402.mechanisms.evm import EthAccountSigner
from x402.mechanisms.evm.exact.register import register_exact_evm_client

client = x402ClientSync()
account = Account.from_key(os.getenv("EVM_PRIVATE_KEY"))
register_exact_evm_client(client, EthAccountSigner(account))

with x402_requests(client) as session:
    response = session.get("https://your-api.example.com/api/data")
    print(response.text)
```

## Getting USDC on Taiko

**Hoodi testnet:**
1. Get L1 Hoodi ETH from a faucet (see taiko:references/networks.md for faucet links)
2. Bridge to Taiko Hoodi at https://bridge.hoodi.taiko.xyz
3. Swap ETH → USDC on a Hoodi DEX

**Mainnet:**
1. Get USDC on Ethereum
2. Bridge to Taiko via https://bridge.taiko.xyz

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

```typescript
import { HTTPFacilitatorClient } from "@x402/core/http";

// List x402 services available via Taiko facilitator
const facilitator = new HTTPFacilitatorClient({
  url: "https://facilitator.taiko.xyz",
});

// Bazaar discovery (if facilitator supports it)
const res = await fetch("https://facilitator.taiko.xyz/discovery/resources");
const services = await res.json();
```
