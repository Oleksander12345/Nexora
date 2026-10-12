import type { Product } from './product.ts';
export interface CartLine {
  readonly productId: string;
  readonly quantity: number;
}
export type CartAction =
  | { type: 'add'; productId: string }
  | { type: 'quantity'; productId: string; quantity: number }
  | { type: 'clear' };
export function cartReducer(
  lines: readonly CartLine[],
  action: CartAction,
): readonly CartLine[] {
  if (action.type === 'clear') return [];
  if (action.type === 'add') {
    const existing = lines.find((line) => line.productId === action.productId);
    return existing
      ? lines.map((line) =>
          line === existing
            ? { ...line, quantity: Math.min(99, line.quantity + 1) }
            : line,
        )
      : [...lines, { productId: action.productId, quantity: 1 }];
  }
  if (!Number.isFinite(action.quantity)) return lines;
  const quantity = Math.max(0, Math.min(99, Math.trunc(action.quantity)));
  return quantity === 0
    ? lines.filter((line) => line.productId !== action.productId)
    : lines.map((line) =>
        line.productId === action.productId ? { ...line, quantity } : line,
      );
}
export function cartTotal(
  lines: readonly CartLine[],
  products: readonly Product[],
): number {
  return lines.reduce(
    (total, line) =>
      total +
      (products.find((product) => product.id === line.productId)?.price ?? 0) *
        line.quantity,
    0,
  );
}
