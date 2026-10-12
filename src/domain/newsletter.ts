export interface NewsletterGateway {
  subscribe(email: string): Promise<void>;
}
