# TSLearn

A small TypeScript learning project: a typed `Order` (nested objects), validated at runtime with [Zod](https://zod.dev), printed to the terminal, and rendered as a JPG receipt.

## Setup

```bash
npm install
```

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Reads `order.json` (or a file path / stdin), validates it against the `Order` schema, prints the result |
| `npm run receipt` | Reads `order.json`, renders an HTML receipt, screenshots it to a JPG in the OS temp directory via headless Chromium |

## Validating different input

```bash
# From a file
npx tsx order.ts order.json

# Piped in directly, no file needed
echo '{"name":"Ion Popescu","delivery":{"street":"Flower St.","number":12,"city":"Cluj-Napoca","postalCode":"400001"},"products":[{"productId":"P-100","name":"Mechanical keyboard","quantity":1,"unitPrice":350}]}' | npx tsx order.ts
```

Invalid data (wrong types, negative quantities, etc.) throws a `ZodError` listing exactly what's wrong, instead of failing silently.

## Files

- `order.schema.ts` — Zod schemas (`Address`, `OrderedProduct`, `Order`) and the TypeScript types derived from them
- `order.ts` — reads + validates an order, prints it
- `receipt.ts` — reads + validates an order, renders it as a JPG receipt
- `generate-schema.ts` — generates a JSON Schema from the Zod schema (for editor autocomplete on `order.json`); rerun after changing `order.schema.ts`
- `order.json` — sample order data
