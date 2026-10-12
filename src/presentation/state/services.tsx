import { createContext, useContext, type ReactNode } from 'react';
import type { CatalogRepository } from '../../domain/product';
import type { OrderGateway } from '../../domain/order';
import type { NewsletterGateway } from '../../domain/newsletter';
export interface Services {
  catalog: CatalogRepository;
  orders: OrderGateway;
  newsletter: NewsletterGateway;
}
const ServicesContext = createContext<Services | null>(null);
export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}
export function useServices() {
  const services = useContext(ServicesContext);
  if (!services)
    throw new Error('useServices must be used inside ServicesProvider');
  return services;
}
export function errorDetails(error: unknown) {
  const details = (typeof error === 'object' && error) || {};
  return {
    message:
      error instanceof Error && error.message
        ? error.message
        : 'Something went wrong. Please try again.',
    status:
      'status' in details && typeof details.status === 'number'
        ? details.status
        : 0,
    fields:
      'fields' in details &&
      typeof details.fields === 'object' &&
      details.fields
        ? (details.fields as Record<string, string>)
        : {},
  };
}
