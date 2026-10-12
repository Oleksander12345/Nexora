import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { existsSync, readFileSync } from 'node:fs';
import { createApp } from './app.ts';
import { openStore } from './db.ts';
const port = Number(process.env.PORT ?? 3000);
const store = openStore(process.env.DB_PATH ?? 'server/data/store.db');
const app = new Hono();
app.route('/', createApp(store));
// With a production build present, the same process serves the SPA.
if (existsSync('dist/index.html')) {
  const shell = readFileSync('dist/index.html', 'utf8');
  app.use('/*', serveStatic({ root: './dist' }));
  app.get('*', (c) => c.html(shell));
}
const server = serve(
  { fetch: app.fetch, port, hostname: '127.0.0.1' },
  (info) =>
    console.log(`NEXORA API listening on http://127.0.0.1:${info.port}`),
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    server.close(() => {
      store.close();
      process.exit(0);
    });
  });
