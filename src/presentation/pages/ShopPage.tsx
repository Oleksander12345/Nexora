import { Link, useSearchParams } from 'react-router';
import * as m from 'motion/react-m';
import {
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XIcon,
} from '@phosphor-icons/react';
import { isCategoryId, type CatalogSort } from '../../application/catalog';
import { CategoryNav } from '../components/CategoryNav';
import { ProductGrid } from '../components/ProductGrid';
import { ProductTile } from '../components/ProductTile';
import { quick } from '../motion/transitions';
import { useCatalog, usePageTitle } from '../state/store';
const sortLabels: Record<CatalogSort, string> = {
  recommended: 'Recommended',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  rating: 'Top rated',
};
const collectionTitles = {
  all: 'The Collection',
  new: 'New Arrivals',
  best: 'Best Sellers',
} as const;
export function ShopPage({
  collection,
}: {
  collection: keyof typeof collectionTitles;
}) {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const rawCategory = params.get('category');
  const category = isCategoryId(catalog.categories, rawCategory)
    ? rawCategory
    : 'all';
  const rawSort = params.get('sort') as CatalogSort | null;
  const sort: CatalogSort =
    rawSort && rawSort in sortLabels ? rawSort : 'recommended';
  const products = catalog.filter({
    query,
    category,
    collection,
    favorites: [],
    sort,
  });
  const categoryName = catalog.category(category)?.name;
  const title = query
    ? `Results for “${query}”`
    : (categoryName ?? collectionTitles[collection]);
  usePageTitle(
    query ? `Search: ${query}` : (categoryName ?? collectionTitles[collection]),
  );
  const filtered = Boolean(query || category !== 'all' || collection !== 'all');
  function setSort(value: CatalogSort) {
    const next = new URLSearchParams(params);
    if (value === 'recommended') next.delete('sort');
    else next.set('sort', value);
    setParams(next, { replace: true, preventScrollReset: true });
  }
  return (
    <div className="container page shop-page">
      <CategoryNav categories={catalog.categories} selected={category} />
      <section className="catalog" aria-labelledby="shop-heading">
        <div className="section-heading">
          <div>
            <h1 id="shop-heading" className="section-title">
              {title}
            </h1>
            <p aria-live="polite">
              {products.length} considered{' '}
              {products.length === 1 ? 'essential' : 'essentials'} for your
              everyday.
            </p>
          </div>
          <label className="sort-control">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as CatalogSort)}
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filtered && (
          <div className="filter-bar">
            <span>
              {[
                collection !== 'all' && collectionTitles[collection],
                categoryName,
                query && `“${query}”`,
              ]
                .filter(Boolean)
                .join(' · ') || 'All categories'}
            </span>
            <Link to="/shop">
              Reset filters
              <XIcon size={13} />
            </Link>
          </div>
        )}
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
              <MagnifyingGlassIcon size={36} />
              <h3>Nothing here just yet.</h3>
              <p>Try another search or explore the full collection.</p>
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
