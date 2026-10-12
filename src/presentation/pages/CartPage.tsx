import { Link } from 'react-router';
import { ArrowRightIcon, ShoppingBagIcon } from '@phosphor-icons/react';
import { cartTotal } from '../../domain/cart';
import { CartLines } from '../components/CartLines';
import { money } from '../format';
import { useCatalog, usePageTitle, useStore } from '../state/store';
export function CartPage() {
  usePageTitle('Your bag');
  const catalog = useCatalog();
  const { cart } = useStore();
  const lines = cart.lines.filter((line) => catalog.find(line.productId));
  return (
    <div className="container page">
      <h1 className="page-title">Your bag</h1>
      {lines.length === 0 ? (
        <div className="empty-state page-empty">
          <ShoppingBagIcon size={48} weight="light" />
          <h2>Good things belong here.</h2>
          <p>Your bag is empty. Find something to brighten your everyday.</p>
          <Link className="pill dark" to="/shop">
            Explore the collection
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="checkout-main">
            <CartLines
              lines={lines}
              products={catalog.products}
              setQuantity={cart.setQuantity}
            />
            <button className="text-link clear-bag" onClick={cart.clear}>
              Clear bag
            </button>
          </div>
          <aside className="order-summary" aria-label="Order summary">
            <h2>Summary</h2>
            <div>
              <span>Items</span>
              <span>{lines.reduce((sum, line) => sum + line.quantity, 0)}</span>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{money(cartTotal(lines, catalog.products))}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <Link className="pill dark checkout" to="/checkout">
              Checkout
              <ArrowRightIcon size={18} />
            </Link>
            <Link className="text-link" to="/shop">
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
