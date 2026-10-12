import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRightIcon,
  LockSimpleIcon,
  ShoppingBagIcon,
} from '@phosphor-icons/react';
import {
  validateOrderDraft,
  type CheckoutErrors,
  type CustomerField,
} from '../../application/checkout';
import {
  deliveryOptions,
  priceOrder,
  type DeliveryMethod,
} from '../../domain/order';
import { money } from '../format';
import { errorDetails, useServices } from '../state/services';
import { useCatalog, usePageTitle, useStore } from '../state/store';
const fields: readonly {
  name: CustomerField;
  label: string;
  type?: string;
  autoComplete: string;
  wide?: boolean;
}[] = [
  { name: 'name', label: 'Full name', autoComplete: 'name', wide: true },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  {
    name: 'address',
    label: 'Street address',
    autoComplete: 'street-address',
    wide: true,
  },
  { name: 'city', label: 'City', autoComplete: 'address-level2' },
  { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code' },
];
const emptyCustomer: Record<CustomerField, string> = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
};
export function CheckoutPage() {
  usePageTitle('Checkout');
  const catalog = useCatalog();
  const { cart } = useStore();
  const { orders } = useServices();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [delivery, setDelivery] = useState<DeliveryMethod>('standard');
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // One idempotency key per distinct submission: retrying the same details after
  // a lost response returns the order that was already created.
  const attempt = useRef<{ key: string; payload: string } | null>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  // The summary disappears once every highlighted field has been corrected.
  const formError = Object.keys(errors).length
    ? serverError || 'Please check the highlighted fields.'
    : serverError;
  const lines = cart.lines.filter((line) => catalog.find(line.productId));
  const pricing = priceOrder(lines, catalog.products, delivery);
  if (lines.length === 0 && !submitting)
    return (
      <div className="container page">
        <div className="empty-state page-empty">
          <ShoppingBagIcon size={48} weight="light" />
          <h1 className="page-title">Your bag is empty.</h1>
          <p>Add something you love, then come back to check out.</p>
          <Link className="pill dark" to="/shop">
            Explore the collection
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validation = validateOrderDraft({ customer, delivery, lines });
    if (!validation.ok) {
      setErrors(validation.errors);
      setServerError('');
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    const payload = JSON.stringify(validation.draft);
    if (attempt.current?.payload !== payload)
      attempt.current = { key: crypto.randomUUID(), payload };
    setErrors({});
    setServerError('');
    setSubmitting(true);
    try {
      const order = await orders.placeOrder(
        validation.draft,
        attempt.current.key,
      );
      navigate(`/order/${order.id}`, { state: { order }, replace: true });
      cart.clear();
    } catch (error) {
      const details = errorDetails(error);
      setErrors(details.fields);
      setServerError(details.message);
      setSubmitting(false);
      requestAnimationFrame(() => errorSummary.current?.focus());
    }
  }
  return (
    <div className="container page">
      <h1 className="page-title">Checkout</h1>
      <form className="checkout-layout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          {formError && (
            <div
              className="form-error"
              role="alert"
              tabIndex={-1}
              ref={errorSummary}
            >
              {formError}
            </div>
          )}
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>Contact & delivery address</legend>
            <div className="field-grid">
              {fields.map((field) => {
                const error = errors[field.name];
                const id = `checkout-${field.name}`;
                return (
                  <div
                    key={field.name}
                    className={`field ${field.wide ? 'wide' : ''}`}
                  >
                    <label htmlFor={id}>{field.label}</label>
                    <input
                      id={id}
                      name={field.name}
                      type={field.type ?? 'text'}
                      autoComplete={field.autoComplete}
                      value={customer[field.name]}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${id}-error` : undefined}
                      onChange={(event) => {
                        const value = event.target.value;
                        setCustomer((previous) => ({
                          ...previous,
                          [field.name]: value,
                        }));
                        if (error)
                          setErrors(({ [field.name]: _, ...rest }) => rest);
                      }}
                    />
                    {error && (
                      <span id={`${id}-error`} className="field-error">
                        {error}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="checkout-section" disabled={submitting}>
            <legend>Delivery method</legend>
            <div className="delivery-options">
              {(Object.keys(deliveryOptions) as DeliveryMethod[]).map(
                (method) => (
                  <label
                    key={method}
                    className={`delivery-option ${delivery === method ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={method}
                      checked={delivery === method}
                      onChange={() => setDelivery(method)}
                    />
                    <span>
                      <strong>{deliveryOptions[method].label}</strong>
                      <span>{deliveryOptions[method].eta}</span>
                    </span>
                    <strong>
                      {deliveryOptions[method].price
                        ? money(deliveryOptions[method].price)
                        : 'Free'}
                    </strong>
                  </label>
                ),
              )}
            </div>
            {errors.delivery && (
              <span className="field-error">{errors.delivery}</span>
            )}
          </fieldset>
        </div>
        <aside className="order-summary" aria-label="Order summary">
          <h2>Your order</h2>
          <ul className="summary-lines">
            {pricing.lines.map((line) => (
              <li key={line.productId}>
                <img
                  src={`/images/${line.image}.webp`}
                  alt=""
                  width={44}
                  height={44}
                />
                <span>
                  {line.name}
                  <small>Qty {line.quantity}</small>
                </span>
                <span>{money(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
          {errors.lines && <span className="field-error">{errors.lines}</span>}
          <div>
            <span>Subtotal</span>
            <span>{money(pricing.subtotal)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>{pricing.shipping ? money(pricing.shipping) : 'Free'}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(pricing.total)}</strong>
          </div>
          <button
            className="pill dark checkout"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Placing order…' : 'Place order'}
            <ArrowRightIcon size={18} />
          </button>
          <p className="summary-note">
            <LockSimpleIcon size={13} />
            No payment is collected in this store. Your order is recorded for
            confirmation.
          </p>
          <Link className="text-link" to="/cart">
            Edit bag
          </Link>
        </aside>
      </form>
    </div>
  );
}
