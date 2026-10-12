# elc-store

React + TypeScript single-page storefront with a minimal local API (Hono + SQLite). Runs locally only; no deployment, authentication, payments or external APIs.
Follow the supplied NEXORA reference in docs/reference.png. Keep the monochrome palette, compact product grid and photographic assets.
Clean architecture: domain is framework independent; application imports domain; infrastructure implements domain ports; presentation imports application/domain only; src/app.tsx is the composition root. The server (server/) reuses domain and application rules, so prices and validation are computed the same way on both sides; the server is the source of truth for prices and orders.
Every screen has a URL (React Router). Keep filters, search and sort in the URL, not component state.
Keep animations lightweight and respect prefers-reduced-motion. Verify primary interactions in browser and run npm test, npm run build and npm run test:e2e before handoff.

## Motion direction
User rejected the original CSS animations as cheap and inconsistent. Use Motion for React for state transitions, with restrained movement and a shared timing curve. No card hopping, compounded hover zoom, bouncy springs, or whole-page entrance animations. Preserve the static visual design. Animate dialog exit before releasing focus and scroll lock.
