import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Link } from 'react-router';
import { MinusIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import type { CartLine } from '../../domain/cart';
import type { Product } from '../../domain/product';
import { quick } from '../motion/transitions';
import { money } from '../format';
interface Props {
  lines: readonly CartLine[];
  products: readonly Product[];
  setQuantity: (id: string, quantity: number) => void;
}
export function CartLines({ lines, products, setQuantity }: Props) {
  return (
    <div className="cart-lines">
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map((line) => {
          const product = products.find((p) => p.id === line.productId);
          if (!product) return null;
          return (
            <m.article
              layout="position"
              className="cart-line"
              key={product.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={quick}
            >
              <img
                src={`/images/${product.image}.webp`}
                alt={product.description}
                width={90}
                height={90}
              />
              <div className="cart-line-info">
                <h3>
                  <Link to={`/product/${product.id}`}>{product.name}</Link>
                </h3>
                <p>{product.description}</p>
                <strong>{money(product.price)}</strong>
                <div className="quantity">
                  <button
                    aria-label={`Decrease ${product.name} quantity`}
                    onClick={() => setQuantity(product.id, line.quantity - 1)}
                  >
                    <MinusIcon size={14} />
                  </button>
                  <span aria-label="Quantity">{line.quantity}</span>
                  <button
                    disabled={line.quantity >= 99}
                    aria-label={`Increase ${product.name} quantity`}
                    onClick={() => setQuantity(product.id, line.quantity + 1)}
                  >
                    <PlusIcon size={14} />
                  </button>
                </div>
              </div>
              <button
                className="icon-button"
                aria-label={`Remove ${product.name}`}
                onClick={() => setQuantity(product.id, 0)}
              >
                <TrashIcon size={17} />
              </button>
            </m.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
