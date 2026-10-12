import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createHash } from 'node:crypto';
import {
  createCatalog,
  isCategoryId,
  type CatalogCollection,
  type CatalogSort,
} from '../src/application/catalog.ts';
import {
  isValidEmail,
  validateOrderDraft,
} from '../src/application/checkout.ts';
import { priceOrder } from '../src/domain/order.ts';
import type { Store } from './db.ts';
const collections: readonly CatalogCollection[] = [
  'featured',
  'all',
  'new',
  'best',
];
const sorts: readonly CatalogSort[] = [
  'recommended',
  'price-asc',
  'price-desc',
  'rating',
];
const fail = (
  c: Context,
  status: 400 | 404 | 409 | 413 | 422 | 500,
  code: string,
  message: string,
  fields?: Record<string, string>,
) =>
  c.json({ error: { code, message, ...(fields ? { fields } : {}) } }, status);
async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
}
export function createApp(store: Store) {
  const app = new Hono().basePath('/api');
  app.use(
    '*',
    bodyLimit({
      maxSize: 16 * 1024,
      onError: (c) =>
        fail(c, 413, 'payload_too_large', 'Request body is too large.'),
    }),
  );
  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/categories', (c) => c.json(store.categories()));
  app.get('/products', (c) => {
    const catalog = createCatalog(store.products(), store.categories());
    const category = c.req.query('category') ?? 'all';
    const collection = (c.req.query('collection') ??
      'all') as CatalogCollection;
    const sort = (c.req.query('sort') ?? 'recommended') as CatalogSort;
    if (category !== 'all' && !isCategoryId(catalog.categories, category))
      return fail(c, 400, 'invalid_category', 'Unknown category.');
    if (!collections.includes(collection))
      return fail(c, 400, 'invalid_collection', 'Unknown collection.');
    if (!sorts.includes(sort))
      return fail(c, 400, 'invalid_sort', 'Unknown sort.');
    return c.json(
      catalog.filter({
        query: (c.req.query('q') ?? '').slice(0, 100),
        category: category as (typeof catalog.categories)[number]['id'] | 'all',
        collection,
        favorites: [],
        sort,
      }),
    );
  });
  app.get('/products/:id', (c) => {
    const product = store
      .products()
      .find((item) => item.id === c.req.param('id'));
    return product
      ? c.json(product)
      : fail(c, 404, 'not_found', 'Product not found.');
  });
  app.post('/orders', async (c) => {
    const key = c.req.header('Idempotency-Key')?.trim() ?? '';
    if (!/^[A-Za-z0-9-]{8,64}$/.test(key))
      return fail(
        c,
        400,
        'missing_idempotency_key',
        'Idempotency-Key header is required.',
      );
    const body = await readJson(c);
    const validation = validateOrderDraft(body);
    if (!validation.ok)
      return fail(
        c,
        422,
        'invalid_order',
        'Please check your details.',
        validation.errors,
      );
    const { draft } = validation;
    // Prices come from the database; the client only sends product IDs and quantities.
    const pricing = priceOrder(draft.lines, store.products(), draft.delivery);
    if (pricing.unknownProductIds.length)
      return fail(
        c,
        422,
        'unknown_products',
        'Some items are no longer available.',
        {
          lines: pricing.unknownProductIds.join(', '),
        },
      );
    const requestHash = createHash('sha256')
      .update(JSON.stringify(draft))
      .digest('hex');
    const result = store.createOrder({
      idempotencyKey: key,
      requestHash,
      customer: draft.customer,
      delivery: draft.delivery,
      pricing,
    });
    if (result.conflict)
      return fail(
        c,
        409,
        'idempotency_conflict',
        'This checkout attempt was already used for a different order.',
      );
    return c.json(result.order, result.replay ? 200 : 201);
  });
  app.get('/orders/:id', (c) => {
    const order = store.order(c.req.param('id'));
    return order
      ? c.json(order)
      : fail(c, 404, 'not_found', 'Order not found.');
  });
  app.post('/newsletter', async (c) => {
    const body = (await readJson(c)) as { email?: unknown } | undefined;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!isValidEmail(email))
      return fail(c, 422, 'invalid_email', 'Enter a valid email address.', {
        email: 'Enter a valid email address',
      });
    store.subscribe(email);
    // Same response for new and existing addresses, so the endpoint does not reveal who subscribed.
    return c.json({ subscribed: true });
  });
  app.notFound((c) => fail(c, 404, 'not_found', 'Not found.'));
  app.onError((error, c) => {
    console.error(error);
    return fail(
      c,
      500,
      'internal_error',
      'Something went wrong. Please try again.',
    );
  });
  return app;
}
