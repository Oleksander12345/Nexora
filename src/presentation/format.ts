const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});
export const money = (cents: number) => currency.format(cents / 100);
