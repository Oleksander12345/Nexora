import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { loadCatalog, type Catalog } from '../../application/catalog';
import { cartReducer, type CartLine } from '../../domain/cart';
import type { Product } from '../../domain/product';
import { readStored, writeStored } from './persistence';
import { errorDetails, useServices } from './services';
const CART_KEY = 'nexora.cart.v1';
const FAVORITES_KEY = 'nexora.favorites.v1';
type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catalog: Catalog };
function parseCart(value: unknown): readonly CartLine[] {
  if (!Array.isArray(value)) return [];
  // Replay stored lines through the reducer so stored data obeys the same limits.
  return value.reduce<readonly CartLine[]>((lines, item) => {
    if (typeof item?.productId !== 'string') return lines;
    const added = cartReducer(lines, {
      type: 'add',
      productId: item.productId,
    });
    return cartReducer(added, {
      type: 'quantity',
      productId: item.productId,
      quantity: Number(item.quantity),
    });
  }, []);
}
function parseFavorites(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === 'string'))]
    : [];
}
function useStoreState() {
  const services = useServices();
  const [catalogState, setCatalogState] = useState<CatalogState>({
    status: 'loading',
  });
  const [attempt, setAttempt] = useState(0);
  const [lines, dispatch] = useReducer(cartReducer, undefined, () =>
    readStored(CART_KEY, parseCart, []),
  );
  const [favorites, setFavorites] = useState<readonly string[]>(() =>
    readStored(FAVORITES_KEY, parseFavorites, []),
  );
  const [toast, setToast] = useState('');
  const [added, setAdded] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    let current = true;
    setCatalogState({ status: 'loading' });
    loadCatalog(services.catalog).then(
      (catalog) => current && setCatalogState({ status: 'ready', catalog }),
      (error) =>
        current &&
        setCatalogState({
          status: 'error',
          message: errorDetails(error).message,
        }),
    );
    return () => {
      current = false;
    };
  }, [services.catalog, attempt]);
  useEffect(() => writeStored(CART_KEY, lines), [lines]);
  useEffect(() => writeStored(FAVORITES_KEY, favorites), [favorites]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(null), 1600);
    return () => clearTimeout(timer);
  }, [added]);
  const addToCart = useCallback(
    (product: Product) => {
      if (
        lines.some(
          (line) => line.productId === product.id && line.quantity >= 99,
        )
      ) {
        setToast('Your bag already has 99 of this item.');
        return;
      }
      dispatch({ type: 'add', productId: product.id });
      setAdded(product.id);
      setToast(`${product.name} added to your bag.`);
    },
    [lines],
  );
  const toggleFavorite = useCallback(
    (product: Product) => {
      const saved = favorites.includes(product.id);
      setFavorites((previous) =>
        saved
          ? previous.filter((id) => id !== product.id)
          : [...previous, product.id],
      );
      setToast(
        saved
          ? 'Removed from your saved collection.'
          : `${product.name} saved for later.`,
      );
    },
    [favorites],
  );
  return {
    catalogState,
    retryCatalog: () => setAttempt((value) => value + 1),
    cart: {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: addToCart,
      setQuantity: (productId: string, quantity: number) =>
        dispatch({ type: 'quantity', productId, quantity }),
      clear: () => dispatch({ type: 'clear' }),
      open: cartOpen,
      setOpen: setCartOpen,
    },
    favorites,
    isSaved: (id: string) => favorites.includes(id),
    toggleFavorite,
    toast,
    showToast: setToast,
    added,
  };
}
export type Store = ReturnType<typeof useStoreState>;
const StoreContext = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}
export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
/** For pages rendered only after the catalog has loaded (see CatalogGate). */
export function useCatalog(): Catalog {
  const { catalogState } = useStore();
  if (catalogState.status !== 'ready')
    throw new Error('Catalog is not loaded yet');
  return catalogState.catalog;
}
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · NEXORA`
      : 'NEXORA — A brighter everyday';
  }, [title]);
}
