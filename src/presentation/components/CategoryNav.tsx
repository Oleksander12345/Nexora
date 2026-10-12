import { Link } from 'react-router';
import type { Category, CategoryId } from '../../domain/product';
/** Round category shortcuts; the selected one links back to the unfiltered shop. */
export function CategoryNav({
  categories,
  selected,
}: {
  categories: readonly Category[];
  selected?: CategoryId | 'all';
}) {
  return (
    <nav className="categories" aria-label="Shop by category">
      {categories.map((item) => {
        const active = selected === item.id;
        return (
          <Link
            key={item.id}
            className={`category ${active ? 'selected' : ''}`}
            to={active ? '/shop' : `/shop?category=${item.id}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="category-photo">
              <img
                src={`/images/${item.image}.webp`}
                alt=""
                width={79}
                height={79}
              />
            </span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
