import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderPage } from './pages/OrderPage';
import { SavedPage } from './pages/SavedPage';
import { InfoPage } from './pages/InfoPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { infoPages } from './pages/infoContent';
export function createRouter() {
  return createBrowserRouter([
    {
      element: <Layout />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'shop', element: <ShopPage key="all" collection="all" /> },
        { path: 'shop/new', element: <ShopPage key="new" collection="new" /> },
        {
          path: 'shop/best',
          element: <ShopPage key="best" collection="best" />,
        },
        { path: 'product/:id', element: <ProductPage /> },
        { path: 'cart', element: <CartPage /> },
        { path: 'checkout', element: <CheckoutPage /> },
        { path: 'order/:id', element: <OrderPage /> },
        { path: 'saved', element: <SavedPage /> },
        ...infoPages.map((page) => ({
          path: page.slug,
          element: <InfoPage page={page} />,
        })),
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]);
}
