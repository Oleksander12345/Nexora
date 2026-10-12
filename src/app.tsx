import { RouterProvider } from 'react-router';
import {
  httpCatalog,
  httpNewsletter,
  httpOrders,
} from './infrastructure/httpApi';
import { mockCatalog } from './infrastructure/mockCatalog';
import { mockNewsletter, mockOrders } from './infrastructure/mockOrders';
import { MotionProvider } from './presentation/motion/MotionProvider';
import { createRouter } from './presentation/router';
import { ServicesProvider, type Services } from './presentation/state/services';
import { StoreProvider } from './presentation/state/store';
// VITE_DATA_SOURCE=mock runs the storefront without the API server.
const services: Services =
  import.meta.env.VITE_DATA_SOURCE === 'mock'
    ? { catalog: mockCatalog, orders: mockOrders, newsletter: mockNewsletter }
    : { catalog: httpCatalog, orders: httpOrders, newsletter: httpNewsletter };
const router = createRouter();
export function App() {
  return (
    <ServicesProvider services={services}>
      <StoreProvider>
        <MotionProvider>
          <RouterProvider router={router} />
        </MotionProvider>
      </StoreProvider>
    </ServicesProvider>
  );
}
