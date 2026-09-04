# starpay

A Node.js SDK client for StarPay Ethiopia's payment API. CommonJS, zero HTTP
dependencies (uses Node's native `fetch`, requires Node >= 18), with automatic
retries, typed errors, and sandbox/production environment switching.

> **Current scope:** only `createTransaction` is wired into the client right
> now. Standalone modules for payment verification and callback signature
> verification exist but are not yet attached to `PaymentGatewayClient`. See
> [Roadmap](#roadmap) below.

---

## Install

```bash
npm install starpay
```

---

## Usage

### Create the client

```js
require("dotenv").config();
const PaymentGatewayClient = require("starpay");

const client = new PaymentGatewayClient({
  apiKey: process.env.STARPAY_API_SECRET,
  environment: process.env.STARPAY_ENV || "sandbox",
});
```

| Constructor option | Required | Default      | Notes                                                         |
| ------------------ | -------- | ------------ | ------------------------------------------------------------- |
| `apiKey`           | Yes      | —            | Sent as `x-api-secret` header                                 |
| `environment`      | Yes      | —            | `'sandbox'` \| `'production'`                                 |
| `timeout`          | No       | `15000` (ms) | Per-request timeout                                           |
| `maxRetries`       | No       | `3`          | Retries on 408/429/5xx and timeouts, with exponential backoff |
| `headers`          | No       | `{}`         | Extra headers merged into every request                       |

### Create a transaction

```js
async function main() {
  const result = await client.createTransaction({
    amount: 250,
    currency: "ETB",
    description: "Order #1042", // optional
    customerName: "Abebe Kebede",
    customerPhoneNumber: "+251911223344", // must start with +251
    customerEmail: "abebe@example.com", // optional
    items: [
      {
        productId: "6812220726f547936d6c1976",
        item_name: "T-shirt",
        quantity: 2,
        unit_price: 125,
      }, // optional
    ],
    callbackURL: "https://yourapp.com/webhooks/starpay", // optional
    redirectUrl: "https://yourapp.com/checkout/success", // optional
  });

  console.log(result);
}

main().catch((err) => console.error("createTransaction failed:", err.message));
```

Calls `POST /trdp/order`. Input is validated locally before any network call:
`amount` must be a positive number, `currency` must be `'ETB'` or `'USD'`, `customerName`
and `customerPhoneNumber` are required, `customerPhoneNumber` must start with
`+251`. Validation errors throw
immediately without hitting the network.

### Verify payment

```js
async function main() {
  const result = await client.verifyPayment({
    orderId: "3683361658",
  });

  console.log(result);
}

main().catch((err) => console.error("verifyPayment failed:", err.message));
```

Calls `POST /trdp/verify`. Input is validated locally before any network call:
`orderId` is required. Validation errors throw
immediately without hitting the network.

## Callback signature verification (standalone — not yet wired into the client)

StarPay signs callback payloads with HMAC-SHA256 over `${timestamp}.${JSON.stringify(payload)}`,
sent as `X-Signature` and `X-Timestamp` headers. This lives in
`starpay` as standalone functions:

```js
const { verifySignature } = require('starpay');

app.post('/webhooks/starpay', express.json(), (req, res) => {
  const isValid = verifySignature({
    payload: req.body,
    timestamp: req.headers['x-timestamp'],
    signature: req.headers['x-signature'],
    secret: process.env.STARPAY_WEBHOOK_SECRET,
  });

  if (!isValid) return res.status(400).send('Invalid signature');

  // trusted — handle req.body
  res.sendStatus(200);
});
```

Uses `crypto.timingSafeEqual` for constant-time comparison to prevent timing
attacks. Signature and expected hash are hex-decoded before comparing (not
compared as UTF-8 text).

---

## Roadmap

Known gaps, in priority order:

1. **Wire `verifyPayment` and `verifyCallbackSignature` into `PaymentGatewayClient`** as `client.verifyPayment(...)` and `client.verifyWebhookSignature(...)`, so they're usable the same way as `createTransaction` instead of separate imports.
2. **Confirm production backend URL** — sandbox and production point to different domains (`https://sandbox-api.starpayethiopia.com/v1/starpay-api/` vs `https://api.starpayethiopia.com/v1/starpay-api/`), not the same domain with a different path. Worth double-checking with StarPay this isn't a docs mismatch before going live.
3. **Confirm `amount` units** — whether StarPay expects major units (e.g. `250` = 250 ETB) or minor units, not fully confirmed against sandbox yet.
4. TypeScript types / `.d.ts`, if needed by consumers.