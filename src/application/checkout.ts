import type { CartLine } from '../domain/cart.ts';
import type { Customer, DeliveryMethod, OrderDraft } from '../domain/order.ts';
export type CustomerField = keyof Customer;
export type CheckoutErrors = Partial<
  Record<CustomerField | 'lines' | 'delivery', string>
>;
export type CheckoutValidation =
  { ok: true; draft: OrderDraft } | { ok: false; errors: CheckoutErrors };
const limits: Record<CustomerField, number> = {
  name: 80,
  email: 120,
  phone: 30,
  address: 160,
  city: 80,
  postalCode: 12,
};
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9 ()-]{7,}$/;
const postalPattern = /^[A-Za-z0-9 -]{3,12}$/;
export const isValidEmail = (value: string) =>
  value.length <= limits.email && emailPattern.test(value);
function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}
// Shared by the checkout form and the API so both reject the same input.
export function validateOrderDraft(input: unknown): CheckoutValidation {
  const body = (typeof input === 'object' && input) || {};
  const rawCustomer =
    'customer' in body && typeof body.customer === 'object' && body.customer
      ? (body.customer as Record<string, unknown>)
      : {};
  const customer = Object.fromEntries(
    (Object.keys(limits) as CustomerField[]).map((field) => [
      field,
      text(rawCustomer[field]),
    ]),
  ) as unknown as Customer;
  const errors: CheckoutErrors = {};
  for (const field of Object.keys(limits) as CustomerField[]) {
    if (!customer[field]) errors[field] = 'Required';
    else if (customer[field].length > limits[field]) errors[field] = 'Too long';
  }
  if (!errors.name && customer.name.length < 2)
    errors.name = 'Enter your full name';
  if (!errors.email && !isValidEmail(customer.email))
    errors.email = 'Enter a valid email address';
  if (!errors.phone && !phonePattern.test(customer.phone))
    errors.phone = 'Enter a valid phone number';
  if (!errors.postalCode && !postalPattern.test(customer.postalCode))
    errors.postalCode = 'Enter a valid postal code';
  const delivery = 'delivery' in body ? body.delivery : undefined;
  if (delivery !== 'standard' && delivery !== 'express')
    errors.delivery = 'Choose a delivery method';
  const lines = parseLines('lines' in body ? body.lines : undefined);
  if (!lines) errors.lines = 'Your bag is empty or invalid';
  if (Object.keys(errors).length || !lines) return { ok: false, errors };
  return {
    ok: true,
    draft: { customer, delivery: delivery as DeliveryMethod, lines },
  };
}
function parseLines(value: unknown): readonly CartLine[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50)
    return null;
  const lines: CartLine[] = [];
  for (const item of value) {
    const productId = item?.productId;
    const quantity = item?.quantity;
    if (
      typeof productId !== 'string' ||
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99 ||
      lines.some((line) => line.productId === productId)
    )
      return null;
    lines.push({ productId, quantity });
  }
  return lines;
}
