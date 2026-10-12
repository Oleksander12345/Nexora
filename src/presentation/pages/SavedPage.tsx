import { Link } from 'react-router';
import * as m from 'motion/react-m';
import { ArrowRightIcon, HeartIcon } from '@phosphor-icons/react';
import { ProductGrid } from '../components/ProductGrid';
import { ProductTile } from '../components/ProductTile';
import { quick } from '../motion/transitions';
import { useCatalog, usePageTitle, useStore } from '../state/store';
export function SavedPage() {
  usePageTitle('Saved collection');
  const catalog = useCatalog();
  const { favorites } = useStore();
  const products = catalog.filter({
    query: '',
    category: 'all',
    collection: 'saved',
    favorites,
  });
  return (
    <div className="container page">
      <section className="catalog" aria-labelledby="saved-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">GOOD TO HAVE YOU HERE</p>
            <h1 id="saved-heading" className="section-title">
              Your Saved Collection
            </h1>
            <p>Saved on this device, ready when you are.</p>
          </div>
        </div>
        <ProductGrid>
          {products.length ? (
            products.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))
          ) : (
            <m.div
              key="empty"
              className="empty-state search-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={quick}
            >
              <HeartIcon size={36} />
              <h3>Your next favorites are waiting.</h3>
              <p>Tap a heart on any product to save it for later.</p>
              <Link className="pill dark" to="/shop">
                Explore all products
                <ArrowRightIcon size={16} />
              </Link>
            </m.div>
          )}
        </ProductGrid>
      </section>
    </div>
  );
}
