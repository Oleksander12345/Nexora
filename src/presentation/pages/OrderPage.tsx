import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { ArrowRightIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { deliveryOptions, type Order } from '../../domain/order';
import { money } from '../format';
import { errorDetails, useServices } from '../state/services';
import { usePageTitle } from '../state/store';
import { NotFoundPage } from './NotFoundPage';
type OrderState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'error'; message: string }
  | { status: 'ready'; order: Order };
export function OrderPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { orders } = useServices();
  const passed = (location.state as { order?: Order } | null)?.order;
  const [state, setState] = useState<OrderState>(
    passed?.id === id
      ? { status: 'ready', order: passed }
      : { status: 'loading' },
  );
  usePageTitle(state.status === 'ready' ? `Order ${state.order.id}` : 'Order');
  useEffect(() => {
    if (passed?.id === id) return;
    let current = true;
    setState({ status: 'loading' });
    orders.getOrder(id).then(
      (order) => current && setState({ status: 'ready', order }),
      (error) => {
        if (!current) return;
        const details = errorDetails(error);
        setState(
          details.status === 404
            ? { status: 'missing' }
            : { status: 'error', message: details.message },
        );
      },
    );
    return () => {
      current = false;
    };
  }, [id, orders, passed]);
  if (state.status === 'missing')
    return (
      <NotFoundPage
        title="We couldn’t find that order."
        message="Check the order number and try again."
      />
    );
  if (state.status !== 'ready')
    return (
      <div className="container page">
        <p
          className="page-lead"
          role={state.status === 'error' ? 'alert' : 'status'}
        >
          {state.status === 'error' ? state.message : 'Loading your order…'}
        </p>
      </div>
    );
  const { order } = state;
  return (
    <div className="container page order-page">
      <div className="order-hero">
        <CheckCircleIcon size={54} weight="light" />
        <p className="eyebrow">ORDER {order.id}</p>
        <h1 className="page-title">
          Thank you, {order.customer.name.split(' ')[0]}.
        </h1>
        <p className="page-lead">
          Your order is confirmed. A brighter day awaits. We’ll use{' '}
          {order.customer.email} for any updates.
        </p>
      </div>
      <div className="checkout-layout">
        <section className="checkout-main" aria-labelledby="order-items">
          <h2 id="order-items" className="section-title-small">
            Items
          </h2>
          <ul className="summary-lines large">
            {order.lines.map((line) => (
              <li key={line.productId}>
                <img
                  src={`/images/${line.image}.webp`}
                  alt=""
                  width={64}
                  height={64}
                />
                <span>
                  <Link to={`/product/${line.productId}`}>{line.name}</Link>
                  <small>
                    {line.quantity} × {money(line.unitPrice)}
                  </small>
                </span>
                <span>{money(line.unitPrice * line.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>
        <aside className="order-summary" aria-label="Order details">
          <h2>Delivery</h2>
          <p className="summary-address">
            {order.customer.name}
            <br />
            {order.customer.address}
            <br />
            {order.customer.postalCode} {order.customer.city}
            <br />
            {order.customer.phone}
          </p>
          <div>
            <span>{deliveryOptions[order.delivery].label}</span>
            <span>{deliveryOptions[order.delivery].eta}</span>
          </div>
          <div>
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>{order.shipping ? money(order.shipping) : 'Free'}</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(order.total)}</strong>
          </div>
          <Link className="pill dark checkout" to="/shop">
            Keep exploring
            <ArrowRightIcon size={18} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
