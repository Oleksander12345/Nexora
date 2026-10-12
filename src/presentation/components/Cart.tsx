import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Link } from 'react-router';
import { ArrowRightIcon, ShoppingBagIcon } from '@phosphor-icons/react';
import { cartTotal } from '../../domain/cart';
import { quick } from '../motion/transitions';
import { money } from '../format';
import { useCatalog, useStore } from '../state/store';
import { CartLines } from './CartLines';
import { Modal } from './Modal';
/** Bag drawer; links inside navigate and the layout closes the drawer on route change. */
export function Cart({ onClose }: { onClose: () => void }) {
  const { cart } = useStore();
  const catalog = useCatalog();
  const total = cartTotal(cart.lines, catalog.products);
  return (
    <Modal title="Your bag" onClose={onClose} drawer>
      <AnimatePresence initial={false} mode="wait">
        {cart.lines.length === 0 ? (
          <m.div
            key="empty"
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
          >
            <ShoppingBagIcon size={48} weight="light" />
            <h3>Good things belong here.</h3>
            <p>Your bag is empty. Find something to brighten your everyday.</p>
            <Link className="pill dark" to="/shop" onClick={onClose}>
              Explore the collection
              <ArrowRightIcon size={16} />
            </Link>
          </m.div>
        ) : (
          <m.div
            key="items"
            className="cart-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quick}
          >
            <p className="cart-caption">
              Thoughtful essentials. Excellent choices.
            </p>
            <CartLines
              lines={cart.lines}
              products={catalog.products}
              setQuantity={cart.setQuantity}
            />
            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{money(total)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <Link className="pill dark checkout" to="/checkout">
                Checkout
                <ArrowRightIcon size={18} />
              </Link>
              <Link className="text-link cart-view-link" to="/cart">
                View full bag
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
