import { forwardRef } from 'react';
import { Link } from 'react-router';
import { useIsPresent } from 'motion/react';
import * as m from 'motion/react-m';
import { quick, settle } from '../motion/transitions';
import {
  HeartIcon,
  ShoppingCartIcon,
  StarIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import type { Product } from '../../domain/product';
import { money } from '../format';
interface Props {
  product: Product;
  saved: boolean;
  added: boolean;
  onFavorite: () => void;
  onAdd: () => void;
  compact?: boolean;
}
export const ProductCard = forwardRef<HTMLElement, Props>(function ProductCard(
  { product, saved, added, onFavorite, onAdd, compact = false }: Props,
  ref,
) {
  const isPresent = useIsPresent();
  return (
    <m.article
      ref={ref}
      layout={compact ? false : 'position'}
      className={compact ? 'product-card compact' : 'product-card'}
      initial={compact ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: quick }}
      transition={settle}
      inert={!isPresent}
      aria-hidden={!isPresent}
    >
      {product.badge && !compact && (
        <span
          className={`badge ${product.badge === 'Bestseller' ? '' : 'badge-green'}`}
        >
          {product.badge}
        </span>
      )}
      <button
        className={`favorite icon-button ${saved ? 'is-saved' : ''}`}
        aria-label={`${saved ? 'Unsave' : 'Save'} ${product.name}`}
        aria-pressed={saved}
        onClick={onFavorite}
      >
        <HeartIcon
          size={compact ? 13 : 17}
          weight={saved ? 'fill' : 'regular'}
        />
      </button>
      <Link
        className="product-image"
        to={`/product/${product.id}`}
        // The name link below is the focusable target; this one only widens the click area.
        aria-hidden="true"
        tabIndex={-1}
      >
        <m.img
          whileHover={{ scale: 1.025 }}
          transition={{ ...settle, duration: 0.45 }}
          src={`/images/${product.image}.webp`}
          alt={product.description}
          width={180}
          height={135}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="product-info">
        <Link className="product-name" to={`/product/${product.id}`}>
          <span>{product.name}</span>
          <span>{product.description}</span>
        </Link>
        <div
          className="rating"
          aria-label={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
        >
          <span className="stars">
            {compact ? (
              <StarIcon weight="fill" size={11} />
            ) : (
              Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} weight="fill" size={11} />
              ))
            )}
          </span>
          <span>
            {product.rating}
            {!compact && ` (${product.reviews})`}
          </span>
        </div>
        <strong className="price">{money(product.price)}</strong>
      </div>
      {!compact && (
        <m.button
          whileTap={{ scale: 0.96 }}
          transition={quick}
          className={`add-button ${added ? 'added' : ''}`}
          onClick={onAdd}
          aria-label={`Add ${product.name} to bag`}
        >
          {added ? <CheckIcon size={17} /> : <ShoppingCartIcon size={17} />}
        </m.button>
      )}
    </m.article>
  );
});
