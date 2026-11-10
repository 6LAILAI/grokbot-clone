import { Hono } from 'hono';
import type { AuthVars } from './lib/auth.js';
import { requireUser } from './lib/auth.js';
import {
  addToCart,
  browseCatalog,
  clearCart,
  faqLookup,
  getCart,
  getOrder,
  listOrders,
  placeOrder,
  productDetail,
  storeMeta,
  updateCartQty,
} from './ecommerce/cart.js';
import {
  catalogStatus,
  getCategories,
  importCsvText,
  syncCatalogFeed,
} from './ecommerce/catalog.js';

/** REST surface for the shopping side panel + chat quick actions. */
export const shopApi = new Hono<AuthVars>();

shopApi.use('*', requireUser);

shopApi.get('/meta', (c) => c.json(storeMeta()));

shopApi.get('/catalog/status', (c) => c.json(catalogStatus()));

shopApi.get('/categories', (c) => c.json({ categories: getCategories() }));

shopApi.get('/products', (c) => {
  const q = c.req.query('q') ?? '';
  const category = c.req.query('category') || undefined;
  const tag = c.req.query('tag') || undefined;
  const max = Number(c.req.query('max') ?? 12);
  return c.json({ products: browseCatalog(q, category, tag, max) });
});

shopApi.get('/products/:id', (c) => {
  const p = productDetail(c.req.param('id'));
  if (!p) return c.json({ error: 'Not found' }, 404);
  return c.json({ product: p });
});

shopApi.get('/cart', (c) => c.json({ cart: getCart(c.get('user').id) }));

shopApi.post('/cart/items', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const variant: Record<string, string> = {};
    if (body.color) variant.color = String(body.color);
    if (body.size) variant.size = String(body.size);
    const cart = addToCart(c.get('user').id, String(body.productId ?? body.product_id), Number(body.qty) || 1, variant);
    return c.json({ cart });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

shopApi.patch('/cart/items/:productId', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const cart = updateCartQty(c.get('user').id, c.req.param('productId'), Number(body.qty));
    return c.json({ cart });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

shopApi.delete('/cart', (c) => c.json({ cart: clearCart(c.get('user').id) }));

shopApi.post('/checkout', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  try {
    const order = placeOrder(c.get('user').id, {
      shippingName: body.shippingName ? String(body.shippingName) : undefined,
      shippingAddress: body.shippingAddress ? String(body.shippingAddress) : undefined,
      note: body.note ? String(body.note) : undefined,
    });
    return c.json({ order });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

shopApi.get('/orders', (c) => c.json({ orders: listOrders(c.get('user').id) }));

shopApi.get('/orders/:id', (c) => {
  const order = getOrder(c.get('user').id, c.req.param('id'));
  if (!order) return c.json({ error: 'Not found' }, 404);
  return c.json({ order });
});

shopApi.get('/faq', (c) => c.json({ hits: faqLookup(c.req.query('q') ?? '') }));

/** Replace catalog from pasted CSV text (merchant admin / operator). */
shopApi.post('/catalog/import-csv', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const csv = typeof body.csv === 'string' ? body.csv : typeof body.text === 'string' ? body.text : '';
  if (!csv.trim()) return c.json({ error: 'Provide { csv: "..." }' }, 400);
  try {
    const result = importCsvText(csv, { replaceAll: body.replaceAll !== false });
    return c.json({ ok: true, ...result, status: catalogStatus() });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

/** Pull CATALOG_FEED_URL into SQLite. */
shopApi.post('/catalog/sync', async (c) => {
  try {
    const result = await syncCatalogFeed({ replaceAll: true });
    return c.json({ ok: true, ...result, status: catalogStatus() });
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});
