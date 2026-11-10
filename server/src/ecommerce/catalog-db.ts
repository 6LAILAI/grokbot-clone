import { db, now } from '../db.js';
import type { FaqEntry, Product } from './types.js';

let migrated = false;

export function ensureCatalogTables() {
  if (migrated) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      price_cents INTEGER NOT NULL,
      compare_at_cents INTEGER,
      currency TEXT NOT NULL DEFAULT 'USD',
      rating REAL NOT NULL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      in_stock INTEGER NOT NULL DEFAULT 0,
      colors_json TEXT NOT NULL DEFAULT '[]',
      sizes_json TEXT NOT NULL DEFAULT '[]',
      tags_json TEXT NOT NULL DEFAULT '[]',
      blurb TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
    CREATE TABLE IF NOT EXISTS shop_faq (
      id TEXT PRIMARY KEY,
      q TEXT NOT NULL,
      a TEXT NOT NULL,
      tags_json TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS shop_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  migrated = true;
}

function parseList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
  } catch {
    return String(raw).split(/[|,]/).map((s) => s.trim()).filter(Boolean);
  }
}

function rowToProduct(r: any): Product {
  return {
    id: String(r.id),
    name: String(r.name),
    brand: String(r.brand ?? ''),
    category: String(r.category ?? ''),
    priceCents: Number(r.price_cents) || 0,
    compareAtCents: r.compare_at_cents == null ? undefined : Number(r.compare_at_cents),
    currency: String(r.currency || 'USD'),
    rating: Number(r.rating) || 0,
    reviewCount: Number(r.review_count) || 0,
    inStock: Number(r.in_stock) || 0,
    colors: parseList(r.colors_json),
    sizes: parseList(r.sizes_json),
    tags: parseList(r.tags_json),
    blurb: String(r.blurb ?? ''),
    image: String(r.image ?? ''),
  };
}

function rowToFaq(r: any): FaqEntry {
  return {
    id: String(r.id),
    q: String(r.q),
    a: String(r.a),
    tags: parseList(r.tags_json),
  };
}

export function getMeta(key: string): string | null {
  ensureCatalogTables();
  const r = db.prepare('SELECT value FROM shop_meta WHERE key=?').get(key) as any;
  return r?.value ?? null;
}

export function setMeta(key: string, value: string) {
  ensureCatalogTables();
  db.prepare('INSERT INTO shop_meta(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
}

export function productCount(): number {
  ensureCatalogTables();
  return (db.prepare('SELECT COUNT(*) n FROM shop_products').get() as any).n as number;
}

export function listAllProducts(): Product[] {
  ensureCatalogTables();
  return (db.prepare('SELECT * FROM shop_products ORDER BY rating DESC, name ASC').all() as any[]).map(rowToProduct);
}

export function getProductRow(id: string): Product | undefined {
  ensureCatalogTables();
  const r = db.prepare('SELECT * FROM shop_products WHERE id=?').get(id) as any;
  return r ? rowToProduct(r) : undefined;
}

export function listFaq(): FaqEntry[] {
  ensureCatalogTables();
  return (db.prepare('SELECT * FROM shop_faq ORDER BY id ASC').all() as any[]).map(rowToFaq);
}

export function upsertProducts(products: Product[], opts: { replaceAll?: boolean } = {}) {
  ensureCatalogTables();
  const t = now();
  const tx = db.transaction(() => {
    if (opts.replaceAll) db.prepare('DELETE FROM shop_products').run();
    const stmt = db.prepare(`
      INSERT INTO shop_products(
        id,name,brand,category,price_cents,compare_at_cents,currency,rating,review_count,in_stock,
        colors_json,sizes_json,tags_json,blurb,image,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, brand=excluded.brand, category=excluded.category,
        price_cents=excluded.price_cents, compare_at_cents=excluded.compare_at_cents,
        currency=excluded.currency, rating=excluded.rating, review_count=excluded.review_count,
        in_stock=excluded.in_stock, colors_json=excluded.colors_json, sizes_json=excluded.sizes_json,
        tags_json=excluded.tags_json, blurb=excluded.blurb, image=excluded.image, updated_at=excluded.updated_at
    `);
    for (const p of products) {
      if (!p.id || !p.name) continue;
      stmt.run(
        p.id,
        p.name,
        p.brand ?? '',
        p.category ?? '',
        Math.round(p.priceCents),
        p.compareAtCents == null ? null : Math.round(p.compareAtCents),
        p.currency || 'USD',
        p.rating ?? 0,
        p.reviewCount ?? 0,
        p.inStock ?? 0,
        JSON.stringify(p.colors ?? []),
        JSON.stringify(p.sizes ?? []),
        JSON.stringify(p.tags ?? []),
        p.blurb ?? '',
        p.image ?? '',
        t,
      );
    }
  });
  tx();
  return productCount();
}

export function upsertFaq(entries: FaqEntry[], opts: { replaceAll?: boolean } = {}) {
  ensureCatalogTables();
  const t = now();
  const tx = db.transaction(() => {
    if (opts.replaceAll) db.prepare('DELETE FROM shop_faq').run();
    const stmt = db.prepare(`
      INSERT INTO shop_faq(id,q,a,tags_json,updated_at) VALUES (?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET q=excluded.q, a=excluded.a, tags_json=excluded.tags_json, updated_at=excluded.updated_at
    `);
    for (const f of entries) {
      if (!f.id || !f.q) continue;
      stmt.run(f.id, f.q, f.a ?? '', JSON.stringify(f.tags ?? []), t);
    }
  });
  tx();
}

export function categoriesFromDb(): string[] {
  ensureCatalogTables();
  return (db.prepare("SELECT DISTINCT category FROM shop_products WHERE category<>'' ORDER BY category").all() as any[])
    .map((r) => String(r.category));
}
