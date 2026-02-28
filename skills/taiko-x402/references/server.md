# x402 Server Setup — Seller Guide

Protect API endpoints so callers must pay USDC per request. The middleware handles the 402 response, payment verification via Taiko facilitator, and retry logic.

## Install

```bash
# Express
npm install @x402/express @x402/evm @x402/core

# Next.js
npm install @x402/next @x402/evm @x402/core

# Go
go get github.com/coinbase/x402/go

# Python (FastAPI or Flask)
pip install "x402[fastapi,evm]"   # or x402[flask,evm]
```

## Express (TypeScript)

```typescript
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
const payTo = process.env.WALLET_ADDRESS!;
const usdcAddress = process.env.USDC_ADDRESS!;

const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://facilitator.taiko.xyz",
});

const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:167000", new ExactEvmScheme())   // Taiko Mainnet
  .register("eip155:167013", new ExactEvmScheme());  // Taiko Hoodi

app.use(
  paymentMiddleware(
    {
      "GET /api/data": {
        accepts: [
          {
            scheme: "exact",
            price: { amount: "1000", asset: usdcAddress },
            network: "eip155:167013",
            payTo,
          },
        ],
        description: "Returns data for this request",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

app.get("/api/data", (req, res) => {
  res.json({ result: "your paid response" });
});

app.listen(3000);
```

Set `USDC_ADDRESS` to the network's USDC token contract from Taikoscan/Blockscout. Some x402 server versions do not provide a default asset for Taiko networks, so use `price` as an `{ amount, asset }` object to avoid 500 errors.

## Next.js (middleware.ts)

Uses `@x402/next` with `paymentProxy` instead of Express middleware. Same facilitator and scheme registration.

```typescript
import { paymentProxy, x402ResourceServer } from "@x402/next";
// ... same facilitatorClient + server setup as Express

export const middleware = paymentProxy(routeConfig, server);
export const config = { matcher: ["/api/protected/:path*"] };
```

## FastAPI (Python)

```python
from fastapi import FastAPI
from x402.http import FacilitatorConfig, HTTPFacilitatorClient, PaymentOption
from x402.http.middleware.fastapi import PaymentMiddlewareASGI
from x402.http.types import RouteConfig
from x402.mechanisms.evm.exact import ExactEvmServerScheme
from x402.server import x402ResourceServer
import os

app = FastAPI()
pay_to = os.getenv("WALLET_ADDRESS")

facilitator = HTTPFacilitatorClient(FacilitatorConfig(url="https://facilitator.taiko.xyz"))
server = x402ResourceServer(facilitator)
server.register("eip155:167000", ExactEvmServerScheme())
server.register("eip155:167013", ExactEvmServerScheme())

routes = {
    "GET /api/data": RouteConfig(
        accepts=[PaymentOption(
            scheme="exact",
            pay_to=pay_to,
            price={"amount": "1000", "asset": os.getenv("USDC_ADDRESS")},
            network="eip155:167013",
        )],
        mime_type="application/json",
        description="Returns data",
    ),
}
app.add_middleware(PaymentMiddlewareASGI, routes=routes, server=server)

@app.get("/api/data")
async def get_data():
    return {"result": "your paid response"}
```

## Route Config Reference

```typescript
interface RouteConfig {
  accepts: Array<{
    scheme: "exact";
    price: {            // preferred on Taiko
      amount: string;   // atomic token amount, e.g. "1000" for 0.001 USDC
      asset: string;    // USDC token contract address
    } | string;         // string price needs a default asset parser for the network
    network: string;    // CAIP-2: "eip155:167000" or "eip155:167013"
    payTo: string;      // your EVM wallet address
  }>;
  description?: string;
  mimeType?: string;
  extensions?: {        // optional Bazaar discovery metadata
    bazaar?: { discoverable: boolean; category: string; tags: string[] };
  };
}
```

## Multi-Network (Accept Both Mainnet and Hoodi)

```typescript
"GET /api/data": {
  accepts: [
    { scheme: "exact", price: { amount: "1000", asset: mainnetUsdc }, network: "eip155:167000", payTo },  // Mainnet
    { scheme: "exact", price: { amount: "1000", asset: hoodiUsdc }, network: "eip155:167013", payTo },    // Hoodi
  ],
  description: "Data endpoint accepting payments from both networks",
},
```

## Testing

```bash
# Should return 402 with PAYMENT-REQUIRED header
curl -sI http://localhost:3000/api/data | head -5
# → HTTP/1.1 402 Payment Required
# → PAYMENT-REQUIRED: base64(...)

# Verbose output (full request/response)
curl -v http://localhost:3000/api/data
```
