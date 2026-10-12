import type {
  CatalogRepository,
  Category,
  CategoryId,
  Product,
} from '../domain/product.ts';
export type CatalogCollection = 'featured' | 'all' | 'new' | 'best' | 'saved';
export type CatalogSort = 'recommended' | 'price-asc' | 'price-desc' | 'rating';
export interface CatalogFilter {
  query: string;
  category: CategoryId | 'all';
  collection: CatalogCollection;
  favorites: readonly string[];
  sort?: CatalogSort;
}
export type Catalog = ReturnType<typeof createCatalog>;
export async function loadCatalog(repository: CatalogRepository) {
  const [products, categories] = await Promise.all([
    repository.getProducts(),
    repository.getCategories(),
  ]);
  return createCatalog(products, categories);
}
export function createCatalog(
  products: readonly Product[],
  categories: readonly Category[],
) {
  return {
    products,
    categories,
    find: (id: string) => products.find((product) => product.id === id),
    category: (id: string) => categories.find((category) => category.id === id),
    filter: (filter: CatalogFilter) => filterProducts(products, filter),
    related: (product: Product, limit = 4) =>
      products
        .filter(
          (item) =>
            item.category === product.category && item.id !== product.id,
        )
        .concat(
          products.filter(
            (item) =>
              item.category !== product.category &&
              item.featured &&
              item.id !== product.id,
          ),
        )
        .slice(0, limit),
  };
}
export function isCategoryId(
  categories: readonly Category[],
  value: string | null | undefined,
): value is CategoryId {
  return categories.some((category) => category.id === value);
}
export function filterProducts(
  products: readonly Product[],
  filter: CatalogFilter,
): readonly Product[] {
  const query = filter.query.trim().toLowerCase();
  const matches = products.filter(
    (product) =>
      (filter.category === 'all' || product.category === filter.category) &&
      (!query ||
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(query)) &&
      (query ||
        filter.category !== 'all' ||
        filter.collection === 'all' ||
        (filter.collection === 'featured' && product.featured) ||
        (filter.collection === 'new' && product.isNew) ||
        (filter.collection === 'best' && product.rating >= 4.8) ||
        (filter.collection === 'saved' &&
          filter.favorites.includes(product.id))) &&
      (filter.collection !== 'saved' || filter.favorites.includes(product.id)),
  );
  return sortProducts(matches, filter.sort ?? 'recommended');
}
export function sortProducts(
  products: readonly Product[],
  sort: CatalogSort,
): readonly Product[] {
  if (sort === 'recommended') return products;
  const sorted = [...products];
  // Array.prototype.sort is stable, so ties keep catalog order.
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
  return sorted;
}
