import { Link, useParams } from 'react-router';
import {
  ArrowCounterClockwiseIcon,
  CaretRightIcon,
  HeartIcon,
  PackageIcon,
  ShoppingCartIcon,
  StarIcon,
  TruckIcon,
} from '@phosphor-icons/react';
import { ProductTile } from '../components/ProductTile';
import { money } from '../format';
import { useCatalog, usePageTitle, useStore } from '../state/store';
import { NotFoundPage } from './NotFoundPage';
export function ProductPage() {
  const { id = '' } = useParams();
  const catalog = useCatalog();
  const store = useStore();
  const product = catalog.find(id);
  usePageTitle(product?.name ?? 'Not found');
  if (!product)
    return (
      <NotFoundPage
        title="We couldn’t find that product."
        message="It may have moved or is no longer part of the collection."
      />
    );
  const category = catalog.category(product.category);
  const saved = store.isSaved(product.id);
  return (
    <div className="container page product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/shop">Shop</Link>
        <CaretRightIcon size={11} aria-hidden="true" />
        {category && (
          <>
            <Link to={`/shop?category=${category.id}`}>{category.name}</Link>
            <CaretRightIcon size={11} aria-hidden="true" />
          </>
        )}
        <span aria-current="page">{product.name}</span>
      </nav>
      <article className="product-detail product-detail-page">
        <div className="detail-photo">
          <img
            src={`/images/${product.image}.webp`}
            alt={product.description}
            width={480}
            height={480}
          />
          {product.badge && (
            <span
              className={`badge ${product.badge === 'Bestseller' ? '' : 'badge-green'}`}
            >
              {product.badge}
            </span>
          )}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">CONSIDERED BY NEXORA</p>
          <h1 className="page-title">{product.name}</h1>
          <h2 className="detail-subtitle">{product.description}</h2>
          <div
            className="detail-rating"
            aria-label={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
          >
            <span className="stars" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} weight="fill" size={13} />
              ))}
            </span>
            {product.rating} / 5 · {product.reviews} reviews
          </div>
          <p className="detail-description">{product.detail}</p>
          <strong className="detail-price">{money(product.price)}</strong>
          <div className="detail-actions">
            <button
              className="pill dark"
              onClick={() => store.cart.add(product)}
            >
              {store.added === product.id ? 'Added to bag' : 'Add to bag'}
              <ShoppingCartIcon size={18} />
            </button>
            <button
              className="detail-save text-link"
              aria-pressed={saved}
              onClick={() => store.toggleFavorite(product)}
            >
              <HeartIcon weight={saved ? 'fill' : 'regular'} size={17} />
              {saved ? 'Saved to your collection' : 'Save for later'}
            </button>
          </div>
          <div className="product-benefits">
            <span>
              <TruckIcon size={18} />
              Complimentary delivery
            </span>
            <span>
              <ArrowCounterClockwiseIcon size={18} />
              30-day returns
            </span>
            <span>
              <PackageIcon size={18} />
              Thoughtfully packaged
            </span>
          </div>
        </div>
      </article>
      <section className="related" aria-labelledby="related-heading">
        <div className="section-heading">
          <h2 id="related-heading">You may also like</h2>
        </div>
        <div className="arrival-grid related-grid">
          {catalog.related(product).map((item) => (
            <ProductTile key={item.id} product={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}
