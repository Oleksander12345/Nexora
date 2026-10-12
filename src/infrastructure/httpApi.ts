import type {
  CatalogRepository,
  Category,
  Product,
} from '../domain/product.ts';
import type { Order, OrderDraft, OrderGateway } from '../domain/order.ts';
import type { NewsletterGateway } from '../domain/newsletter.ts';
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Readonly<Record<string, string>> = {},
  ) {
    super(message);
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError(
      0,
      'network_error',
      'We could not reach the store. Check your connection and try again.',
    );
  }
  const body = await response.json().catch(() => undefined);
  if (!response.ok) {
    const error = body?.error ?? {};
    throw new ApiError(
      response.status,
      error.code ?? 'http_error',
      error.message ?? 'Something went wrong. Please try again.',
      error.fields,
    );
  }
  return body as T;
}
const postJson = (body: unknown, headers: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify(body),
});
export const httpCatalog: CatalogRepository = {
  getProducts: () => request<Product[]>('/products?collection=all'),
  getCategories: () => request<Category[]>('/categories'),
};
export const httpOrders: OrderGateway = {
  placeOrder: (draft: OrderDraft, idempotencyKey: string) =>
    request<Order>(
      '/orders',
      postJson(draft, { 'Idempotency-Key': idempotencyKey }),
    ),
  getOrder: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}`),
};
export const httpNewsletter: NewsletterGateway = {
  subscribe: async (email: string) => {
    await request('/newsletter', postJson({ email }));
  },
};
