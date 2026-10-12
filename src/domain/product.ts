export type CategoryId =
  | 'audio'
  | 'home'
  | 'wearables'
  | 'phone'
  | 'bags'
  | 'workspace'
  | 'lifestyle'
  | 'gifts';
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: CategoryId;
  readonly price: number; // USD cents
  readonly rating: number;
  readonly reviews: string;
  readonly image: string;
  readonly badge?: 'Bestseller' | 'New' | 'Eco Pick';
  readonly featured?: boolean;
  readonly isNew?: boolean;
  readonly detail: string;
}
export interface Category {
  readonly id: CategoryId;
  readonly name: string;
  readonly image: string;
}
export interface CatalogRepository {
  getProducts(): Promise<readonly Product[]>;
  getCategories(): Promise<readonly Category[]>;
}
