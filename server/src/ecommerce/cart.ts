import { db, now } from '../db.js';
import { newId } from '../lib/ids.js';
import { catalogStatus, getCategories, getProduct, money, productSummary, searchFaq, searchProducts, storeCurrency, storeName, type Product } from './catalog.js';
import { ensureCatalogTables } from './catalog-db.js';

let migrated = false;

export function ensureShopTables() {
  if (migrated) return;
  ensureCatalogTables();
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_cart (
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      variant_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS shop_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      items_json TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL,
      shipping_name TEXT,
      shipping_address TEXT,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  migrated = true;
}

export type OrderStatus = 'placed' | 'packing' | 'shipped' | 'delivered' | 'cancelled';

export interface CartLine {
  productId: string;
  qty: number;
  variant: Record<string, string>;
  product: ReturnType<typeof productSummary>;
  lineTotalCents: number;
  lineTotal: string;
}

export interface CartView {
  store: string;
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
  subtotal: string;
}

function variantKey(v: Record<string, string>) {
  return JSON.stringify(Object.keys(v).sort().reduce((o, k) => ({ ...o, [k]: v[k] }), {} as Record<string, string>));
}

export function getCart(userId: string): CartView {
  ensureShopTables();
  const rows = db.prepare('SELECT product_id, qty, variant_json FROM shop_cart WHERE user_id=? ORDER BY updated_at DESC').all(userId) as any[];
  const items: CartLine[] = [];
  for (const r of rows) {
    const p = getProduct(r.product_id);
    if (!p) continue;
    const qty = Number(r.qty) || 0;
    if (qty <= 0) continue;
    let variant: Record<string, string> = {};
    try { variant = JSON.parse(r.variant_json || '{}'); } catch { variant = {}; }
    const lineTotalCents = p.priceCents * qty;
    items.push({
      productId: p.id,
      qty,
      variant,
      product: productSummary(p),
      lineTotalCents,
      lineTotal: money(lineTotalCents),
    });
  }
  const subtotalCents = items.reduce((s, i) => s + i.lineTotalCents, 0);
  return {
    store: storeName(),
    items,
    itemCount: items.reduce((s, i) => s + i.qty, 0),
    subtotalCents,
    subtotal: money(subtotalCents, storeCurrency()),
  };
}

export function addToCart(userId: string, productId: string, qty = 1, variant: Record<string, string> = {}) {
  ensureShopTables();
  const p = getProduct(productId);
  if (!p) throw new Error(`Unknown product ${productId}`);
  const n = Math.max(1, Math.min(20, Math.floor(Number(qty) || 1)));
  if (p.inStock < n) throw new Error(`Only ${p.inStock} left in stock for ${p.name}`);
  if (variant.color && p.colors && !p.colors.map((c) => c.toLowerCase()).includes(variant.color.toLowerCase())) {
    throw new Error(`Color "${variant.color}" not available. Options: ${p.colors.join(', ')}`);
  }
  if (variant.size && p.sizes && !p.sizes.map((s) => s.toLowerCase()).includes(variant.size.toLowerCase())) {
    throw new Error(`Size "${variant.size}" not available. Options: ${p.sizes.join(', ')}`);
  }
  const existing = db.prepare('SELECT qty FROM shop_cart WHERE user_id=? AND product_id=?').get(userId, productId) as any;
  const nextQty = (existing?.qty ?? 0) + n;
  if (nextQty > p.inStock) throw new Error(`Cart would exceed stock (${p.inStock}) for ${p.name}`);
  db.prepare(
    'INSERT INTO shop_cart(user_id, product_id, qty, variant_json, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id, product_id) DO UPDATE SET qty=excluded.qty, variant_json=excluded.variant_json, updated_at=excluded.updated_at',
  ).run(userId, productId, nextQty, variantKey(variant), now());
  return getCart(userId);
}

export function updateCartQty(userId: string, productId: string, qty: number) {
  ensureShopTables();
  const p = getProduct(productId);
  if (!p) throw new Error(`Unknown product ${productId}`);
  const n = Math.floor(Number(qty) || 0);
  if (n <= 0) {
    db.prepare('DELETE FROM shop_cart WHERE user_id=? AND product_id=?').run(userId, productId);
  } else {
    if (n > p.inStock) throw new Error(`Only ${p.inStock} in stock`);
    const row = db.prepare('SELECT variant_json FROM shop_cart WHERE user_id=? AND product_id=?').get(userId, productId) as any;
    db.prepare(
      'INSERT INTO shop_cart(user_id, product_id, qty, variant_json, updated_at) VALUES (?,?,?,?,?) ON CONFLICT(user_id, product_id) DO UPDATE SET qty=excluded.qty, updated_at=excluded.updated_at',
    ).run(userId, productId, n, row?.variant_json ?? '{}', now());
  }
  return getCart(userId);
}

export function clearCart(userId: string) {
  ensureShopTables();
  db.prepare('DELETE FROM shop_cart WHERE user_id=?').run(userId);
  return getCart(userId);
}

export function placeOrder(userId: string, opts: { shippingName?: string; shippingAddress?: string; note?: string } = {}) {
  ensureShopTables();
  const cart = getCart(userId);
  if (!cart.items.length) throw new Error('Cart is empty');
  const id = newId('ord');
  const items = cart.items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    qty: i.qty,
    variant: i.variant,
    unitPriceCents: i.product.priceCents,
    lineTotalCents: i.lineTotalCents,
  }));
  const t = now();
  db.prepare(
    'INSERT INTO shop_orders(id,user_id,items_json,total_cents,status,shipping_name,shipping_address,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
  ).run(id, userId, JSON.stringify(items), cart.subtotalCents, 'placed', opts.shippingName ?? '', opts.shippingAddress ?? '', opts.note ?? '', t, t);
  db.prepare('DELETE FROM shop_cart WHERE user_id=?').run(userId);
  return getOrder(userId, id)!;
}

export function getOrder(userId: string, orderId: string) {
  ensureShopTables();
  const r = db.prepare('SELECT * FROM shop_orders WHERE id=? AND user_id=?').get(orderId, userId) as any;
  if (!r) return null;
  return formatOrder(r);
}

export function listOrders(userId: string, limit = 10) {
  ensureShopTables();
  const rows = db.prepare('SELECT * FROM shop_orders WHERE user_id=? ORDER BY created_at DESC LIMIT ?').all(userId, limit) as any[];
  return rows.map(formatOrder);
}

function formatOrder(r: any) {
  let items: unknown[] = [];
  try { items = JSON.parse(r.items_json); } catch { items = []; }
  return {
    id: r.id as string,
    status: r.status as OrderStatus,
    items,
    totalCents: r.total_cents as number,
    total: money(r.total_cents, storeCurrency()),
    shippingName: r.shipping_name as string,
    shippingAddress: r.shipping_address as string,
    note: r.note as string,
    createdAt: r.created_at as number,
    updatedAt: r.updated_at as number,
  };
}

export function advanceOrderDemo(userId: string, orderId: string) {
  ensureShopTables();
  const order = getOrder(userId, orderId);
  if (!order) throw new Error('Order not found');
  const flow: OrderStatus[] = ['placed', 'packing', 'shipped', 'delivered'];
  const i = flow.indexOf(order.status);
  if (i < 0 || i >= flow.length - 1) return order;
  const next = flow[i + 1];
  db.prepare('UPDATE shop_orders SET status=?, updated_at=? WHERE id=? AND user_id=?').run(next, now(), orderId, userId);
  return getOrder(userId, orderId)!;
}

export function browseCatalog(query = '', category?: string, tag?: string, max = 8) {
  return searchProducts(query, { category, tag, max }).map(productSummary);
}

export function productDetail(id: string) {
  const p = getProduct(id);
  if (!p) return null;
  return productSummary(p);
}

export function faqLookup(query: string) {
  return searchFaq(query);
}

export function storeMeta() {
  const status = catalogStatus();
  return {
    name: status.storeName,
    categories: getCategories(),
    productCount: status.productCount,
    currency: status.currency,
    source: status.source,
    lastSyncAt: status.lastSyncAt,
    note: status.source === 'demo-seed'
      ? 'Demo seed catalog in use. Import CSV or set CATALOG_FEED_URL for the merchant catalog. Selection bags stage design sheets (no PSP charge).'
      : 'Serving merchant catalog from SQLite for ecommerce design services. Staged sheets are not consumer checkouts.',
  };
}

export type { Product };
