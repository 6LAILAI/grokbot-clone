import fs from 'node:fs';
import path from 'node:path';
import type { CatalogFeed, FaqEntry, Product } from './types.js';

/** Split a CSV line respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuotes = false; continue; }
      cur += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ',') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function listField(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (v == null || v === '') return [];
  return String(v).split(/[|,;/]/).map((s) => s.trim()).filter(Boolean);
}

function moneyToCents(v: unknown): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number' && Number.isFinite(v)) {
    // Heuristic: values like 28.00 are dollars; integers > 500 likely already cents unless marked.
    if (Number.isInteger(v) && Math.abs(v) >= 1000) return Math.round(v);
    if (Number.isInteger(v) && Math.abs(v) < 500) return Math.round(v * 100);
    return Math.round(v * 100);
  }
  const s = String(v).trim().replace(/[$,\s]/g, '');
  if (!s) return 0;
  if (/^\d+$/.test(s) && s.length >= 4) return Number(s);
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function normalizeProduct(raw: Record<string, unknown>): Product | null {
  const id = String(raw.id ?? raw.sku ?? raw.handle ?? '').trim();
  const name = String(raw.name ?? raw.title ?? '').trim();
  if (!id || !name) return null;
  const priceCents = raw.price_cents != null || raw.priceCents != null
    ? Math.round(Number(raw.price_cents ?? raw.priceCents) || 0)
    : moneyToCents(raw.price);
  const compareRaw = raw.compare_at_cents ?? raw.compareAtCents ?? raw.compare_at ?? raw.compareAt;
  const compareAtCents = compareRaw == null || compareRaw === ''
    ? undefined
    : (raw.compare_at_cents != null || raw.compareAtCents != null
      ? Math.round(Number(compareRaw) || 0)
      : moneyToCents(compareRaw));
  return {
    id,
    name,
    brand: String(raw.brand ?? raw.vendor ?? '').trim(),
    category: String(raw.category ?? raw.product_type ?? raw.type ?? '').trim(),
    priceCents,
    compareAtCents,
    currency: String(raw.currency ?? 'USD').trim() || 'USD',
    rating: Number(raw.rating ?? 0) || 0,
    reviewCount: Number(raw.review_count ?? raw.reviewCount ?? 0) || 0,
    inStock: Number(raw.in_stock ?? raw.inStock ?? raw.inventory ?? raw.quantity ?? 0) || 0,
    colors: listField(raw.colors ?? raw.color),
    sizes: listField(raw.sizes ?? raw.size),
    tags: listField(raw.tags),
    blurb: String(raw.blurb ?? raw.description ?? raw.body ?? '').trim(),
    image: String(raw.image ?? raw.image_url ?? raw.imageUrl ?? '').trim(),
  };
}

function normalizeFaq(raw: Record<string, unknown>): FaqEntry | null {
  const id = String(raw.id ?? '').trim() || `faq-${String(raw.q ?? raw.question ?? '').slice(0, 24).toLowerCase().replace(/\W+/g, '-')}`;
  const q = String(raw.q ?? raw.question ?? '').trim();
  const a = String(raw.a ?? raw.answer ?? '').trim();
  if (!q || !a) return null;
  return { id, q, a, tags: listField(raw.tags) };
}

/** Parse merchant CSV into products. Header names are case-insensitive. */
export function parseCatalogCsv(text: string): Product[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const products: Product[] = [];
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ''; });
    const p = normalizeProduct(row);
    if (p) products.push(p);
  }
  return products;
}

export function parseCatalogFeed(json: unknown): CatalogFeed {
  const root = (json && typeof json === 'object' ? json as any : {});
  const list = Array.isArray(root) ? root : (root.products ?? root.items ?? root.data ?? []);
  const products = (Array.isArray(list) ? list : [])
    .map((x) => normalizeProduct(x && typeof x === 'object' ? x as Record<string, unknown> : {}))
    .filter((p): p is Product => !!p);
  const faqRaw = Array.isArray(root.faq) ? root.faq : [];
  const faq = faqRaw
    .map((x: any) => normalizeFaq(x && typeof x === 'object' ? x : {}))
    .filter((f: FaqEntry | null): f is FaqEntry => !!f);
  return {
    store: root.store && typeof root.store === 'object' ? root.store : undefined,
    products,
    faq,
  };
}

export function readCatalogCsvFile(filePath: string): Product[] {
  const abs = path.resolve(filePath);
  const text = fs.readFileSync(abs, 'utf8');
  return parseCatalogCsv(text);
}

export async function fetchCatalogFeed(url: string, token?: string): Promise<CatalogFeed> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Catalog feed ${res.status}: ${await res.text().then((t) => t.slice(0, 200))}`);
  return parseCatalogFeed(await res.json());
}
