import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Category, CategoryId, Product } from '../src/domain/product.ts';
import type {
  Customer,
  DeliveryMethod,
  Order,
  OrderLine,
  OrderPricing,
} from '../src/domain/order.ts';
import {
  mockCategories,
  mockProducts,
} from '../src/infrastructure/mockCatalog.ts';
const schema = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES categories(id),
    price INTEGER NOT NULL CHECK (price > 0),
    rating REAL NOT NULL,
    reviews TEXT NOT NULL,
    image TEXT NOT NULL,
    badge TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    is_new INTEGER NOT NULL DEFAULT 0,
    detail TEXT NOT NULL,
    position INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    request_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    customer TEXT NOT NULL,
    delivery TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping INTEGER NOT NULL,
    total INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS order_lines (
    order_id TEXT NOT NULL REFERENCES orders(id),
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    PRIMARY KEY (order_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    email TEXT PRIMARY KEY COLLATE NOCASE,
    created_at TEXT NOT NULL
  );
`;
type Row = Record<string, unknown>;
export type Store = ReturnType<typeof openStore>;
export function openStore(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schema);
  seed(db);
  const toProduct = (row: Row): Product => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    category: row.category as CategoryId,
    price: Number(row.price),
    rating: Number(row.rating),
    reviews: row.reviews as string,
    image: row.image as string,
    detail: row.detail as string,
    ...(row.badge ? { badge: row.badge as Product['badge'] } : {}),
    ...(row.featured ? { featured: true } : {}),
    ...(row.is_new ? { isNew: true } : {}),
  });
  const selectOrder = db.prepare('SELECT * FROM orders WHERE id = ?');
  const selectOrderByKey = db.prepare(
    'SELECT * FROM orders WHERE idempotency_key = ?',
  );
  const selectLines = db.prepare(
    'SELECT * FROM order_lines WHERE order_id = ? ORDER BY rowid',
  );
  const toOrder = (row: Row): Order => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    customer: JSON.parse(row.customer as string) as Customer,
    delivery: row.delivery as DeliveryMethod,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    lines: (selectLines.all(row.id as string) as Row[]).map(
      (line): OrderLine => ({
        productId: line.product_id as string,
        name: line.name as string,
        image: line.image as string,
        unitPrice: Number(line.unit_price),
        quantity: Number(line.quantity),
      }),
    ),
  });
  return {
    close: () => db.close(),
    products: (): readonly Product[] =>
      (
        db.prepare('SELECT * FROM products ORDER BY position').all() as Row[]
      ).map(toProduct),
    categories: (): readonly Category[] =>
      db
        .prepare('SELECT id, name, image FROM categories ORDER BY position')
        .all() as unknown as Category[],
    order: (id: string): Order | undefined => {
      const row = selectOrder.get(id) as Row | undefined;
      return row && toOrder(row);
    },
    /**
     * Inserts the order unless the idempotency key was already used.
     * Returns the stored order and whether the earlier request had the same body.
     */
    createOrder(input: {
      idempotencyKey: string;
      requestHash: string;
      customer: Customer;
      delivery: DeliveryMethod;
      pricing: OrderPricing;
    }): { order: Order; replay: boolean; conflict: boolean } {
      // node:sqlite is synchronous, so this check-and-insert cannot interleave
      // with another request in this process; the UNIQUE key guards the rest.
      db.exec('BEGIN IMMEDIATE');
      try {
        const existing = selectOrderByKey.get(input.idempotencyKey) as
          Row | undefined;
        if (existing) {
          db.exec('COMMIT');
          return {
            order: toOrder(existing),
            replay: true,
            conflict: existing.request_hash !== input.requestHash,
          };
        }
        const id = newOrderId(db);
        const createdAt = new Date().toISOString();
        db.prepare(
          `INSERT INTO orders (id, idempotency_key, request_hash, created_at, customer, delivery, subtotal, shipping, total)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          input.idempotencyKey,
          input.requestHash,
          createdAt,
          JSON.stringify(input.customer),
          input.delivery,
          input.pricing.subtotal,
          input.pricing.shipping,
          input.pricing.total,
        );
        const insertLine = db.prepare(
          'INSERT INTO order_lines (order_id, product_id, name, image, unit_price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        );
        for (const line of input.pricing.lines)
          insertLine.run(
            id,
            line.productId,
            line.name,
            line.image,
            line.unitPrice,
            line.quantity,
          );
        db.exec('COMMIT');
        return {
          order: toOrder(selectOrder.get(id) as Row),
          replay: false,
          conflict: false,
        };
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
    subscribe(email: string) {
      db.prepare(
        'INSERT OR IGNORE INTO newsletter_subscribers (email, created_at) VALUES (?, ?)',
      ).run(email, new Date().toISOString());
    },
    subscriberCount: () =>
      Number(
        (
          db
            .prepare('SELECT COUNT(*) AS count FROM newsletter_subscribers')
            .get() as Row
        ).count,
      ),
  };
}
function newOrderId(db: DatabaseSync) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const id = `NX-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
    if (!db.prepare('SELECT 1 FROM orders WHERE id = ?').get(id)) return id;
  }
}
function seed(db: DatabaseSync) {
  const count = db
    .prepare('SELECT COUNT(*) AS count FROM products')
    .get() as Row;
  if (Number(count.count) > 0) return;
  db.exec('BEGIN');
  const insertCategory = db.prepare(
    'INSERT INTO categories (id, name, image, position) VALUES (?, ?, ?, ?)',
  );
  mockCategories.forEach((category, index) =>
    insertCategory.run(category.id, category.name, category.image, index),
  );
  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, description, category, price, rating, reviews, image, badge, featured, is_new, detail, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  mockProducts.forEach((product, index) =>
    insertProduct.run(
      product.id,
      product.name,
      product.description,
      product.category,
      product.price,
      product.rating,
      product.reviews,
      product.image,
      product.badge ?? null,
      product.featured ? 1 : 0,
      product.isNew ? 1 : 0,
      product.detail,
      index,
    ),
  );
  db.exec('COMMIT');
}
