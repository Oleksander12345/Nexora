import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  ArrowRightIcon,
  CaretDownIcon,
  HeartIcon,
  ListIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
} from '@phosphor-icons/react';
import { quick } from '../motion/transitions';
import { useStore } from '../state/store';
export function Header() {
  const { catalogState, cart } = useStore();
  const categories =
    catalogState.status === 'ready' ? catalogState.catalog.categories : [];
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const onShop = location.pathname.startsWith('/shop');
  const urlQuery = onShop ? (searchParams.get('q') ?? '') : '';
  const [query, setQuery] = useState(urlQuery);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // The URL owns the search; the field only mirrors it, e.g. after Back.
  useEffect(() => setQuery(urlQuery), [urlQuery]);
  useEffect(() => setMenu(false), [location.key]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);
  function search(value: string) {
    setQuery(value);
    const params = new URLSearchParams();
    if (value) params.set('q', value);
    // Replace while typing so Back leaves search instead of stepping through keystrokes.
    navigate(
      { pathname: '/shop', search: params.toString() },
      { replace: onShop },
    );
  }
  return (
    <header className="site-header">
      <div className="header-shell">
        <Link className="wordmark" to="/">
          NEXORA
        </Link>
        <div
          className="navigation"
          ref={menuRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMenu(false);
          }}
        >
          <button
            className={`shop-trigger ${menu ? 'active' : ''}`}
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            aria-controls="shop-menu"
          >
            Shop
            <CaretDownIcon size={11} />
          </button>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link to="/shop/new">New Arrivals</Link>
            <Link to="/shop/best">Best Sellers</Link>
            <Link to="/#collections">Collections</Link>
            <Link to="/about">About</Link>
          </nav>
          <button
            className="mobile-menu icon-button"
            aria-label={menu ? 'Close shop menu' : 'Open shop menu'}
            aria-controls="shop-menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <XIcon size={22} /> : <ListIcon size={22} />}
          </button>
          <AnimatePresence>
            {menu && (
              <m.div
                key="menu"
                id="shop-menu"
                className="shop-menu"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={quick}
              >
                <p>FIND YOUR EVERYDAY</p>
                <Link to="/shop">
                  Shop all
                  <ArrowRightIcon size={15} />
                </Link>
                {categories.map((item) => (
                  <Link key={item.id} to={`/shop?category=${item.id}`}>
                    {item.name}
                    <ArrowRightIcon size={14} />
                  </Link>
                ))}
                <nav
                  className="mobile-nav-links"
                  aria-label="Mobile navigation"
                >
                  <Link to="/shop/new">New Arrivals</Link>
                  <Link to="/shop/best">Best Sellers</Link>
                  <Link to="/#collections">Collections</Link>
                  <Link to="/about">About</Link>
                </nav>
                <Link to="/saved">
                  Saved collection
                  <HeartIcon size={15} />
                </Link>
              </m.div>
            )}
          </AnimatePresence>
        </div>
        <div className="header-actions">
          <div className="search" role="search">
            <input
              type="search"
              value={query}
              onChange={(event) => search(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') search(query.trim());
              }}
              aria-label="Search products"
              placeholder="Search for products, brands..."
            />
            {query ? (
              <button
                className="icon-button"
                aria-label="Clear search"
                onClick={() => search('')}
              >
                <XIcon size={15} />
              </button>
            ) : (
              <MagnifyingGlassIcon size={16} />
            )}
          </div>
          <Link
            className="account"
            to="/saved"
            aria-label="Account, saved collection"
          >
            <UserIcon size={18} weight="fill" />
            <span>Account</span>
          </Link>
          <button
            className="bag-button"
            onClick={() => cart.setOpen(true)}
            aria-label={`Open bag, ${cart.count} items`}
          >
            <ShoppingCartIcon size={21} />
            <m.span
              className="bag-count"
              animate={{ scale: 1 }}
              transition={quick}
            >
              {cart.count}
            </m.span>
          </button>
        </div>
      </div>
    </header>
  );
}
