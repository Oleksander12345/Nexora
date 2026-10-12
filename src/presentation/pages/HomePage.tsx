import { Link, useNavigate } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { Hero } from '../components/Hero';
import { CategoryNav } from '../components/CategoryNav';
import { ProductGrid } from '../components/ProductGrid';
import { ProductTile } from '../components/ProductTile';
import { useCatalog, usePageTitle } from '../state/store';
export function HomePage() {
  usePageTitle('');
  const catalog = useCatalog();
  const navigate = useNavigate();
  const featured = catalog.filter({
    query: '',
    category: 'all',
    collection: 'featured',
    favorites: [],
  });
  const arrivals = catalog.products.filter(
    (product) => product.isNew && product.id !== 'pulse',
  );
  return (
    <>
      <Hero onShop={(id) => navigate(`/shop?category=${id}`)} />
      <div className="container">
        <CategoryNav categories={catalog.categories} />
        <section className="catalog" aria-labelledby="featured-heading">
          <div className="section-heading">
            <div>
              <h2 id="featured-heading">Featured Products</h2>
              <p>Handpicked for a smarter, brighter you.</p>
            </div>
            <Link className="text-link" to="/shop">
              View all
              <ArrowRightIcon size={15} />
            </Link>
          </div>
          <ProductGrid>
            {featured.map((product) => (
              <ProductTile key={product.id} product={product} />
            ))}
          </ProductGrid>
        </section>
        <section
          className="collections"
          id="collections"
          aria-label="Curated collections"
        >
          <article className="campaign carry">
            <img
              src="/images/carry.webp"
              alt="Traveler with a commuter backpack looking over an alpine lake"
              width={800}
              height={153}
              loading="lazy"
            />
            <div className="campaign-copy">
              <p className="eyebrow">FOR A BRIGHTER TOMORROW</p>
              <h2>
                Carry What
                <br />
                Moves You.
              </h2>
              <p>Thoughtful gear for wherever life takes you.</p>
              <Link className="pill dark" to="/shop?category=bags">
                Explore Bags
                <ArrowRightIcon size={13} />
              </Link>
            </div>
          </article>
          <article className="campaign details">
            <img
              src="/images/details.webp"
              alt="A considered collection of black desk and phone accessories"
              width={395}
              height={153}
              loading="lazy"
            />
            <div className="campaign-copy">
              <h2>
                The Details
                <br />
                Make the Difference.
              </h2>
              <p>Minimal tools. Major impact.</p>
              <Link className="pill" to="/shop?category=phone">
                Shop Accessories
                <ArrowRightIcon size={13} />
              </Link>
            </div>
          </article>
        </section>
        <section
          className="arrivals"
          id="arrivals"
          aria-labelledby="arrivals-heading"
        >
          <div className="section-heading">
            <div>
              <h2 id="arrivals-heading">New Arrivals</h2>
              <p>Fresh finds for a brighter tomorrow.</p>
            </div>
            <Link className="text-link" to="/shop/new">
              View all
              <ArrowRightIcon size={15} />
            </Link>
          </div>
          <div className="arrival-grid">
            {arrivals.map((product) => (
              <ProductTile key={product.id} product={product} compact />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
