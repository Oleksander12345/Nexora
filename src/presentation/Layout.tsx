import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Cart } from './components/Cart';
import { quick } from './motion/transitions';
import { useStore } from './state/store';
export function Layout() {
  const store = useStore();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);
  const { setOpen: setCartOpen } = store.cart;
  useEffect(() => setCartOpen(false), [location.pathname, setCartOpen]);
  // Move focus to the new page for keyboard and screen-reader users, and honour #hash links.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const focusPage = () => {
      const target = location.hash
        ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
        : null;
      if (target) target.scrollIntoView({ block: 'start' });
      mainRef.current?.focus({ preventScroll: true });
    };
    // An open dialog keeps the page inert until its exit animation finishes.
    if (document.querySelector('dialog[open]')) {
      const timer = setTimeout(focusPage, 420);
      return () => clearTimeout(timer);
    }
    focusPage();
  }, [location.pathname, location.search, location.hash]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1} className="storefront-main">
        {store.catalogState.status === 'ready' ? (
          <Outlet />
        ) : store.catalogState.status === 'loading' ? (
          <div className="container page catalog-status" role="status">
            <div className="skeleton-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="skeleton-card" />
              ))}
            </div>
            <span className="visually-hidden">Loading the collection…</span>
          </div>
        ) : (
          <div className="container page">
            <div className="empty-state page-empty" role="alert">
              <WarningCircleIcon size={44} weight="light" />
              <h1 className="page-title">We couldn’t load the collection.</h1>
              <p>{store.catalogState.message}</p>
              <button className="pill dark" onClick={store.retryCatalog}>
                Try again
                <ArrowCounterClockwiseIcon size={16} />
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <div className="toast-region">
        <AnimatePresence>
          {store.toast && (
            <m.div
              key="toast"
              className="toast"
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={quick}
            >
              <CheckIcon size={16} />
              {store.toast}
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {store.cart.open && store.catalogState.status === 'ready' && (
          <Cart key="cart" onClose={() => setCartOpen(false)} />
        )}
      </AnimatePresence>
      <ScrollRestoration />
    </>
  );
}
