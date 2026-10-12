import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.ts';
import { openStore } from '../server/db.ts';
function setup() {
  const store = openStore(':memory:');
  return { store, app: createApp(store) };
}
const customer = {
  name: 'Mariia Test',
  email: 'mariia@example.com',
  phone: '+380 44 123 4567',
  address: '1 Khreshchatyk St',
  city: 'Kyiv',
  postalCode: '01001',
};
const order = {
  customer,
  delivery: 'express',
  lines: [
    { productId: 'flow', quantity: 2 },
    { productId: 'drift', quantity: 1 },
  ],
};
const post = (body: unknown, key = 'checkout-key-0001') => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
  body: JSON.stringify(body),
});
test('catalog endpoints return the seeded data and apply filters', async () => {
  const { app } = setup();
  assert.equal((await (await app.request('/api/health')).json()).status, 'ok');
  const categories = await (await app.request('/api/categories')).json();
  assert.equal(categories.length, 8);
  const audio = await (
    await app.request('/api/products?category=audio')
  ).json();
  assert.deepEqual(
    audio.map((p: { id: string }) => p.id),
    ['flow', 'beam', 'air'],
  );
  const cheap = await (
    await app.request('/api/products?collection=all&sort=price-asc')
  ).json();
  assert.equal(cheap.length, 14);
  assert.ok(cheap[0].price <= cheap[1].price);
  assert.equal((await app.request('/api/products?category=cars')).status, 400);
  assert.equal((await app.request('/api/products?sort=random')).status, 400);
});
test('a product can be read by id and unknown ids are 404', async () => {
  const { app } = setup();
  const flow = await (await app.request('/api/products/flow')).json();
  assert.equal(flow.price, 19900);
  assert.equal(flow.badge, 'Bestseller');
  assert.equal((await app.request('/api/products/nope')).status, 404);
  assert.equal((await app.request('/api/unknown')).status, 404);
});
test('orders are priced on the server, ignoring client prices', async () => {
  const { app } = setup();
  const response = await app.request(
    '/api/orders',
    post({
      ...order,
      lines: order.lines.map((l) => ({ ...l, price: 1 })),
      total: 1,
    }),
  );
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.match(created.id, /^NX-[A-Z0-9]{8}$/);
  assert.equal(created.subtotal, 43200);
  assert.equal(created.shipping, 1500);
  assert.equal(created.total, 44700);
  assert.equal(created.lines[0].unitPrice, 19900);
  const fetched = await (await app.request(`/api/orders/${created.id}`)).json();
  assert.deepEqual(fetched, created);
});
test('repeating a checkout with the same key returns the same order once', async () => {
  const { app, store } = setup();
  const first = await app.request('/api/orders', post(order));
  const second = await app.request('/api/orders', post(order));
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  const [a, b] = [await first.json(), await second.json()];
  assert.equal(a.id, b.id);
  const conflict = await app.request(
    '/api/orders',
    post({ ...order, delivery: 'standard' }),
  );
  assert.equal(conflict.status, 409);
  const other = await app.request(
    '/api/orders',
    post(order, 'checkout-key-0002'),
  );
  assert.notEqual((await other.json()).id, a.id);
  assert.ok(store.order(a.id));
});
test('invalid orders are rejected with field errors and nothing is stored', async () => {
  const { app } = setup();
  const missingKey = await app.request('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  assert.equal(missingKey.status, 400);
  const invalid = await app.request(
    '/api/orders',
    post({ ...order, customer: { ...customer, email: 'x' } }),
  );
  assert.equal(invalid.status, 422);
  assert.equal(
    (await invalid.json()).error.fields.email,
    'Enter a valid email address',
  );
  const unknown = await app.request(
    '/api/orders',
    post(
      { ...order, lines: [{ productId: 'ghost', quantity: 1 }] },
      'checkout-key-0003',
    ),
  );
  assert.equal(unknown.status, 422);
  assert.equal((await unknown.json()).error.code, 'unknown_products');
  const malformed = await app.request('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': 'checkout-key-0004',
    },
    body: '{not json',
  });
  assert.equal(malformed.status, 422);
  assert.equal((await app.request('/api/orders/NX-MISSING1')).status, 404);
});
test('oversized bodies are refused', async () => {
  const { app } = setup();
  const response = await app.request(
    '/api/orders',
    post({ ...order, padding: 'x'.repeat(20_000) }),
  );
  assert.equal(response.status, 413);
});
test('newsletter accepts valid emails once and rejects invalid ones', async () => {
  const { app, store } = setup();
  const subscribe = (email: string) =>
    app.request('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  assert.equal((await subscribe('hello@example.com')).status, 200);
  assert.equal((await subscribe('HELLO@example.com')).status, 200);
  assert.equal(store.subscriberCount(), 1);
  assert.equal((await subscribe('not-an-email')).status, 422);
});
