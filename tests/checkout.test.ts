import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceOrder } from '../src/domain/order.ts';
import { validateOrderDraft } from '../src/application/checkout.ts';
import { mockProducts } from '../src/infrastructure/mockCatalog.ts';
const customer = {
  name: 'Mariia Test',
  email: 'mariia@example.com',
  phone: '+380 44 123 4567',
  address: '1 Khreshchatyk St',
  city: 'Kyiv',
  postalCode: '01001',
};
test('order pricing uses catalog prices and adds express shipping', () => {
  const lines = [
    { productId: 'flow', quantity: 2 },
    { productId: 'drift', quantity: 1 },
  ];
  const standard = priceOrder(lines, mockProducts, 'standard');
  assert.equal(standard.subtotal, 43200);
  assert.equal(standard.shipping, 0);
  assert.equal(standard.total, 43200);
  const express = priceOrder(lines, mockProducts, 'express');
  assert.equal(express.total, 44700);
});
test('unknown products are reported, not priced', () => {
  const pricing = priceOrder(
    [{ productId: 'ghost', quantity: 1 }],
    mockProducts,
    'express',
  );
  assert.deepEqual(pricing.unknownProductIds, ['ghost']);
  assert.equal(pricing.total, 0);
});
test('a complete draft is accepted and trimmed', () => {
  const result = validateOrderDraft({
    customer: { ...customer, name: '  Mariia Test ' },
    delivery: 'standard',
    lines: [{ productId: 'flow', quantity: 1 }],
  });
  assert.ok(result.ok);
  assert.equal(result.draft.customer.name, 'Mariia Test');
});
test('invalid fields, delivery and lines are all reported', () => {
  const result = validateOrderDraft({
    customer: { ...customer, email: 'nope', phone: '12' },
    delivery: 'teleport',
    lines: [{ productId: 'flow', quantity: 0 }],
  });
  assert.equal(result.ok, false);
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'delivery',
    'email',
    'lines',
    'phone',
  ]);
});
test('duplicate lines, empty bags and non-objects are rejected', () => {
  for (const body of [
    null,
    'text',
    { customer, delivery: 'standard', lines: [] },
    {
      customer,
      delivery: 'standard',
      lines: [
        { productId: 'flow', quantity: 1 },
        { productId: 'flow', quantity: 2 },
      ],
    },
    {
      customer,
      delivery: 'standard',
      lines: [{ productId: 'flow', quantity: 1.5 }],
    },
  ])
    assert.equal(validateOrderDraft(body).ok, false);
});
