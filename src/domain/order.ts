import type { CartLine } from './cart.ts';
import type { Product } from './product.ts';
export type DeliveryMethod = 'standard' | 'express';
export const deliveryOptions: Readonly<
  Record<DeliveryMethod, { label: string; eta: string; price: number }>
> = {
  standard: { label: 'Standard delivery', eta: '3–5 business days', price: 0 },
  express: { label: 'Express delivery', eta: '1–2 business days', price: 1500 },
};
export interface Customer {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly city: string;
  readonly postalCode: string;
}
export interface OrderDraft {
  readonly customer: Customer;
  readonly delivery: DeliveryMethod;
  readonly lines: readonly CartLine[];
}
export interface OrderLine {
  readonly productId: string;
  readonly name: string;
  readonly image: string;
  readonly unitPrice: number; // USD cents
  readonly quantity: number;
}
export interface OrderPricing {
  readonly lines: readonly OrderLine[];
  readonly subtotal: number;
  readonly shipping: number;
  readonly total: number;
  readonly unknownProductIds: readonly string[];
}
export interface Order extends Omit<OrderPricing, 'unknownProductIds'> {
  readonly id: string;
  readonly createdAt: string;
  readonly customer: Customer;
  readonly delivery: DeliveryMethod;
}
export interface OrderGateway {
  // The key identifies one checkout attempt, so a repeated submit returns the same order.
  placeOrder(draft: OrderDraft, idempotencyKey: string): Promise<Order>;
  getOrder(id: string): Promise<Order>;
}
export function priceOrder(
  lines: readonly CartLine[],
  products: readonly Product[],
  delivery: DeliveryMethod,
): OrderPricing {
  const priced: OrderLine[] = [];
  const unknownProductIds: string[] = [];
  for (const line of lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) {
      unknownProductIds.push(line.productId);
      continue;
    }
    priced.push({
      productId: product.id,
      name: product.name,
      image: product.image,
      unitPrice: product.price,
      quantity: line.quantity,
    });
  }
  const subtotal = priced.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shipping = priced.length ? deliveryOptions[delivery].price : 0;
  return {
    lines: priced,
    subtotal,
    shipping,
    total: subtotal + shipping,
    unknownProductIds,
  };
}
