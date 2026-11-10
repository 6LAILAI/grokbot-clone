/** Shared catalog types for merchant product data. */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  compareAtCents?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  inStock: number;
  colors?: string[];
  sizes?: string[];
  tags: string[];
  blurb: string;
  image: string;
}

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
  tags: string[];
}

export interface CatalogFeed {
  store?: { name?: string; currency?: string };
  products: Product[];
  faq?: FaqEntry[];
}

export type CatalogSource = 'sqlite' | 'csv' | 'feed' | 'demo-seed';
