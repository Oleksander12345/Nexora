# NEXORA · elc-store

A responsive React + TypeScript single-page storefront based on the supplied NEXORA reference, with a minimal local API. Catalog, orders and newsletter sign-ups are stored in SQLite. There is no authentication, payment or email sending; the project is meant to run locally.

## Requirements

Node.js 22.13 or newer (uses built-in `node:sqlite` and TypeScript type stripping).

## Run

```sh
npm ci
npm run dev
```

`npm run dev` starts the API on http://127.0.0.1:3000 (restarts on change) and the Vite dev server on http://127.0.0.1:5173, which proxies `/api` to it. Open http://127.0.0.1:5173.

Single-process production-style run (builds, then the API also serves `dist/` with SPA fallback):

```sh
npm start            # http://127.0.0.1:3000
```

Frontend only, without the API (in-memory catalog and orders):

```sh
VITE_DATA_SOURCE=mock npm run dev:web
```

Environment variables: `PORT` (default 3000), `DB_PATH` (default `server/data/store.db`; created and seeded on first start; delete it to reset).

## Checks

```sh
npm test             # domain, application, architecture and API tests (node:test)
npm run build        # strict typecheck + production build
npm run test:e2e     # Chromium journey against the built app and a temporary database
npm run format:check
```

`test:e2e` needs a build (`npm run build`) and Playwright's Chromium (`npx playwright install chromium` once).

## Routes

| URL | Screen |
|---|---|
| `/` | Home: hero, categories, featured products, campaigns, new arrivals |
| `/shop`, `/shop/new`, `/shop/best` | Catalog; `?category=`, `?q=`, `?sort=` live in the URL |
| `/product/:id` | Product page with related products |
| `/cart` | Bag (the header bag also opens a drawer) |
| `/checkout` | Contact, address and delivery form |
| `/order/:id` | Order confirmation, loaded from the API |
| `/saved` | Saved products |
| `/about`, `/support`, `/sustainability`, `/journal` | Information pages |

The bag and saved products are kept in `localStorage`, so they survive reloads on the same device.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/categories` | |
| GET | `/api/products` | `category`, `q`, `collection` (`featured`/`all`/`new`/`best`), `sort` (`recommended`/`price-asc`/`price-desc`/`rating`) |
| GET | `/api/products/:id` | 404 if unknown |
| POST | `/api/orders` | Requires `Idempotency-Key` header. Body: `{ customer, delivery, lines: [{ productId, quantity }] }`. Prices and totals are computed on the server; repeating a request with the same key returns the same order. |
| GET | `/api/orders/:id` | |
| POST | `/api/newsletter` | `{ email }` |

Errors are `{ "error": { "code", "message", "fields"? } }`.

## Architecture

- `src/domain`: product, cart and order contracts and rules (prices are integer USD cents), repository/gateway ports.
- `src/application`: catalog filtering and sorting, checkout validation shared by the form and the API.
- `src/infrastructure`: HTTP adapters for the API and in-memory mock adapters.
- `src/presentation`: router, layout, pages, components, UI state (cart, favorites, toasts), styles.
- `src/app.tsx`: composition root that picks the adapters.
- `server/`: Hono app (`app.ts`), SQLite store and seed (`db.ts`), process entry (`index.ts`).
- `tests/`: unit, architecture and API tests; `e2e/smoke.mjs`: browser journey.

## Visual assets

`docs/reference.png` is the supplied design reference. Campaign banners and product photographs are generated with Image Gen based on that reference; category thumbnails are source photographs extracted from the supplied image. Assets are prototype artwork, not manufacturer product photography. See `docs/assets.md`.
