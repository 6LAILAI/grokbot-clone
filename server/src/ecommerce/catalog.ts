/**
 * Merchant catalog facade.
 * Source of truth is SQLite (`shop_products` / `shop_faq`), loaded from:
 * - CATALOG_FEED_URL (JSON feed)
 * - CATALOG_CSV_PATH (CSV file on boot / CLI)
 * - optional demo seed when empty and CATALOG_SEED_DEMO=1
 */

import { env } from '../env.js';
import {
  categoriesFromDb,
  ensureCatalogTables,
  getMeta,
  getProductRow,
  listAllProducts,
  listFaq,
  productCount,
  setMeta,
  upsertFaq,
  upsertProducts,
} from './catalog-db.js';
import { fetchCatalogFeed, parseCatalogCsv, readCatalogCsvFile } from './catalog-import.js';
import { DEMO_FAQ, DEMO_PRODUCTS, DEMO_STORE_NAME } from './demo-seed.js';
import type { CatalogSource, FaqEntry, Product } from './types.js';

export type { Product, FaqEntry, CatalogSource };

let bootstrapped = false;

export function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function storeName(): string {
  return getMeta('store_name') || env.storeName || DEMO_STORE_NAME;
}

export function storeCurrency(): string {
  return getMeta('store_currency') || env.storeCurrency || 'USD';
}

export function catalogSource(): CatalogSource {
  return (getMeta('catalog_source') as CatalogSource) || 'sqlite';
}

export function getProduct(id: string) {
  ensureCatalogTables();
  return getProductRow(id);
}

export function allProducts(): Product[] {
  ensureCatalogTables();
  return listAllProducts();
}

export function searchProducts(query: string, opts: { category?: string; tag?: string; max?: number } = {}) {
  const max = opts.max ?? 8;
  const q = query.trim().toLowerCase();
  const words = q ? q.split(/\s+/).filter(Boolean) : [];
  let list = allProducts();
  if (opts.category) {
    const c = opts.category.toLowerCase();
    list = list.filter((p) => p.category.toLowerCase() === c);
  }
  if (opts.tag) {
    const t = opts.tag.toLowerCase();
    list = list.filter((p) => p.tags.some((x) => x.toLowerCase() === t));
  }
  if (words.length) {
    list = list
      .map((p) => {
        const hay = `${p.name} ${p.brand} ${p.category} ${p.blurb} ${p.tags.join(' ')} ${p.colors?.join(' ') ?? ''}`.toLowerCase();
        const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
      .map((x) => x.p);
  } else {
    list.sort((a, b) => b.rating - a.rating);
  }
  return list.slice(0, max);
}

export function searchFaq(query: string, max = 4): FaqEntry[] {
  const faq = listFaq();
  const q = query.trim().toLowerCase();
  if (!q) return faq.slice(0, max);
  const words = q.split(/\s+/).filter(Boolean);
  return faq
    .map((f) => {
      const hay = `${f.q} ${f.a} ${f.tags.join(' ')}`.toLowerCase();
      const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f)
    .slice(0, max);
}

export function productSummary(p: Product) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: money(p.priceCents, p.currency || storeCurrency()),
    priceCents: p.priceCents,
    compareAt: p.compareAtCents ? money(p.compareAtCents, p.currency || storeCurrency()) : undefined,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    colors: p.colors,
    sizes: p.sizes,
    tags: p.tags,
    blurb: p.blurb,
    image: p.image,
  };
}

export function getCategories() {
  return categoriesFromDb();
}

/** @deprecated use getCategories() — kept for older imports */
export const CATEGORIES = [] as string[];

export function catalogStatus() {
  ensureCatalogTables();
  return {
    storeName: storeName(),
    currency: storeCurrency(),
    source: catalogSource(),
    productCount: productCount(),
    faqCount: listFaq().length,
    lastSyncAt: getMeta('last_sync_at'),
    feedUrlConfigured: !!env.catalogFeedUrl,
    csvPathConfigured: !!env.catalogCsvPath,
    seedDemo: env.catalogSeedDemo,
  };
}

export function importProducts(products: Product[], opts: { replaceAll?: boolean; source: CatalogSource; store?: string; currency?: string; faq?: FaqEntry[] }) {
  ensureCatalogTables();
  const count = upsertProducts(products, { replaceAll: opts.replaceAll });
  if (opts.faq?.length) upsertFaq(opts.faq, { replaceAll: opts.replaceAll });
  if (opts.store) setMeta('store_name', opts.store);
  if (opts.currency) setMeta('store_currency', opts.currency);
  setMeta('catalog_source', opts.source);
  setMeta('last_sync_at', new Date().toISOString());
  return { productCount: count, source: opts.source };
}

export function importCsvText(text: string, opts: { replaceAll?: boolean } = {}) {
  const products = parseCatalogCsv(text);
  if (!products.length) throw new Error('No products found in CSV');
  return importProducts(products, { replaceAll: opts.replaceAll ?? true, source: 'csv' });
}

export function importCsvFile(filePath: string, opts: { replaceAll?: boolean } = {}) {
  const products = readCatalogCsvFile(filePath);
  if (!products.length) throw new Error(`No products found in ${filePath}`);
  return importProducts(products, { replaceAll: opts.replaceAll ?? true, source: 'csv' });
}

export async function syncCatalogFeed(opts: { replaceAll?: boolean } = {}) {
  if (!env.catalogFeedUrl) throw new Error('CATALOG_FEED_URL is not set');
  const feed = await fetchCatalogFeed(env.catalogFeedUrl, env.catalogFeedToken || undefined);
  if (!feed.products.length) throw new Error('Catalog feed returned zero products');
  return importProducts(feed.products, {
    replaceAll: opts.replaceAll ?? true,
    source: 'feed',
    store: feed.store?.name || env.storeName,
    currency: feed.store?.currency || env.storeCurrency,
    faq: feed.faq,
  });
}

function seedDemoIfEmpty() {
  if (productCount() > 0) return false;
  if (!env.catalogSeedDemo) return false;
  importProducts(DEMO_PRODUCTS, {
    replaceAll: true,
    source: 'demo-seed',
    store: env.storeName || DEMO_STORE_NAME,
    currency: env.storeCurrency || 'USD',
    faq: DEMO_FAQ,
  });
  console.log(`[catalog] seeded ${DEMO_PRODUCTS.length} demo products (set CATALOG_SEED_DEMO=0 and import CSV/feed for production)`);
  return true;
}

/** Load CSV / feed / demo into SQLite. Safe to call multiple times. */
export async function bootstrapCatalog() {
  if (bootstrapped) return catalogStatus();
  ensureCatalogTables();
  try {
    if (env.catalogFeedUrl) {
      const r = await syncCatalogFeed({ replaceAll: true });
      console.log(`[catalog] synced feed → ${r.productCount} products`);
    } else if (env.catalogCsvPath) {
      const r = importCsvFile(env.catalogCsvPath, { replaceAll: true });
      console.log(`[catalog] imported CSV ${env.catalogCsvPath} → ${r.productCount} products`);
    } else {
      seedDemoIfEmpty();
    }
  } catch (e) {
    console.warn('[catalog] bootstrap failed:', (e as Error).message);
    seedDemoIfEmpty();
  }
  bootstrapped = true;
  if (env.catalogSyncIntervalMs > 0 && env.catalogFeedUrl) {
    setInterval(() => {
      syncCatalogFeed({ replaceAll: true })
        .then((r) => console.log(`[catalog] periodic sync → ${r.productCount} products`))
        .catch((err) => console.warn('[catalog] periodic sync failed', (err as Error).message));
    }, env.catalogSyncIntervalMs).unref?.();
  }
  return catalogStatus();
}

// Back-compat aliases used by older modules
export const STORE_NAME = env.storeName || DEMO_STORE_NAME;
export const PRODUCTS: Product[] = [];
export const FAQ: FaqEntry[] = [];
