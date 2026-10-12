import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartReducer, cartTotal } from '../src/domain/cart.ts';
import { createCatalog } from '../src/application/catalog.ts';
import {
  mockCatalog,
  mockCategories,
  mockProducts,
} from '../src/infrastructure/mockCatalog.ts';
import { loadCatalog } from '../src/application/catalog.ts';
const catalog = createCatalog(mockProducts, mockCategories);
const filter = {
  query: '',
  category: 'all',
  collection: 'all',
  favorites: [],
} as const;
test('two headphones and a bottle cost exactly $432 without floating-point errors', () => {
  const cart = cartReducer(
    cartReducer(cartReducer([], { type: 'add', productId: 'flow' }), {
      type: 'add',
      productId: 'flow',
    }),
    { type: 'add', productId: 'drift' },
  );
  assert.equal(cart.length, 2);
  assert.equal(cartTotal(cart, catalog.products), 43200);
});
test('zero quantity removes a line and clear empties the order', () => {
  const cart = [
    { productId: 'flow', quantity: 2 },
    { productId: 'drift', quantity: 1 },
  ];
  assert.deepEqual(
    cartReducer(cart, { type: 'quantity', productId: 'flow', quantity: 0 }),
    [{ productId: 'drift', quantity: 1 }],
  );
  assert.deepEqual(cartReducer(cart, { type: 'clear' }), []);
});
test('quantities are capped and non-finite changes cannot corrupt totals', () => {
  const cart = [{ productId: 'flow', quantity: 99 }];
  assert.deepEqual(cartReducer(cart, { type: 'add', productId: 'flow' }), cart);
  assert.deepEqual(
    cartReducer(cart, { type: 'quantity', productId: 'flow', quantity: NaN }),
    cart,
  );
  assert.equal(
    cartReducer(cart, { type: 'quantity', productId: 'flow', quantity: 1.7 })[0]
      .quantity,
    1,
  );
});
test('search ignores case and whitespace and searches descriptions', () => {
  assert.deepEqual(
    catalog.filter({ ...filter, query: '  HEADPHONES  ' }).map((p) => p.id),
    ['flow'],
  );
});
test('category includes new products that are absent from the featured section', () => {
  assert.deepEqual(
    catalog.filter({ ...filter, category: 'audio' }).map((p) => p.id),
    ['flow', 'beam', 'air'],
  );
  assert.deepEqual(
    catalog.filter({ ...filter, collection: 'featured' }).map((p) => p.id),
    ['flow', 'pulse', 'beam', 'fold', 'drift', 'daily'],
  );
});
test('saved collection is intersected with search and category filters', () => {
  assert.deepEqual(
    catalog
      .filter({
        ...filter,
        collection: 'saved',
        favorites: ['flow', 'daily'],
        query: 'backpack',
      })
      .map((p) => p.id),
    ['daily'],
  );
  assert.equal(
    catalog.filter({ ...filter, collection: 'saved', favorites: [] }).length,
    0,
  );
});
test('no matching search returns an empty result', () => {
  assert.equal(
    catalog.filter({ ...filter, query: 'no-such-product-123' }).length,
    0,
  );
});
test('all category references and product IDs are valid and unique', () => {
  assert.equal(
    new Set(catalog.products.map((p) => p.id)).size,
    catalog.products.length,
  );
  for (const product of catalog.products) {
    assert.ok(catalog.categories.some((c) => c.id === product.category));
    assert.ok(Number.isInteger(product.price) && product.price > 0);
  }
});
test('the async repository port loads the same catalog', async () => {
  const loaded = await loadCatalog(mockCatalog);
  assert.equal(loaded.products.length, catalog.products.length);
  assert.equal(loaded.categories.length, 8);
});
test('sorting by price is ascending/descending and keeps ties in catalog order', () => {
  const ascending = catalog.filter({ ...filter, sort: 'price-asc' });
  for (let i = 1; i < ascending.length; i++)
    assert.ok(ascending[i - 1].price <= ascending[i].price);
  const descending = catalog.filter({ ...filter, sort: 'price-desc' });
  assert.equal(
    descending[0].price,
    Math.max(...catalog.products.map((p) => p.price)),
  );
  const beamAndFold = ascending.filter(
    (p) => p.id === 'beam' || p.id === 'fold',
  );
  assert.deepEqual(
    beamAndFold.map((p) => p.id),
    ['beam', 'fold'],
  );
});
test('related products prefer the same category and exclude the product', () => {
  const flow = catalog.find('flow')!;
  const related = catalog.related(flow);
  assert.ok(!related.some((p) => p.id === 'flow'));
  assert.deepEqual(
    related.slice(0, 2).map((p) => p.id),
    ['beam', 'air'],
  );
  assert.equal(related.length, 4);
});
