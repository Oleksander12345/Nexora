import { forwardRef } from 'react';
import type { Product } from '../../domain/product';
import { useStore } from '../state/store';
import { ProductCard } from './ProductCard';
/** ProductCard wired to the shared cart and favorites. */
export const ProductTile = forwardRef<
  HTMLElement,
  { product: Product; compact?: boolean }
>(function ProductTile({ product, compact = false }, ref) {
  const store = useStore();
  return (
    <ProductCard
      ref={ref}
      product={product}
      compact={compact}
      saved={store.isSaved(product.id)}
      added={store.added === product.id}
      onFavorite={() => store.toggleFavorite(product)}
      onAdd={() => store.cart.add(product)}
    />
  );
});
