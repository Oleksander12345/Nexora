import type { Order, OrderGateway } from '../domain/order.ts';
import { priceOrder } from '../domain/order.ts';
import type { NewsletterGateway } from '../domain/newsletter.ts';
import { mockProducts } from './mockCatalog.ts';
// In-memory stand-ins for running the frontend without the API (VITE_DATA_SOURCE=mock).
const orders = new Map<string, Order>();
const byKey = new Map<string, string>();
export const mockOrders: OrderGateway = {
  async placeOrder(draft, idempotencyKey) {
    const existing = byKey.get(idempotencyKey);
    if (existing) return orders.get(existing)!;
    const { unknownProductIds: _, ...pricing } = priceOrder(
      draft.lines,
      mockProducts,
      draft.delivery,
    );
    const order: Order = {
      ...pricing,
      id: `NX-DEMO${String(orders.size + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      customer: draft.customer,
      delivery: draft.delivery,
    };
    orders.set(order.id, order);
    byKey.set(idempotencyKey, order.id);
    return order;
  },
  async getOrder(id) {
    const order = orders.get(id);
    if (!order) throw new Error('Order not found.');
    return order;
  },
};
export const mockNewsletter: NewsletterGateway = { subscribe: async () => {} };
