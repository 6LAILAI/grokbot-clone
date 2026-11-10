import { appendRow } from '../store.js';
import type { ActivityKind } from '../types.js';
import {
  addToCart,
  advanceOrderDemo,
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
} from './cart.js';

export interface ShopToolCtx {
  userId: string;
  botId: string;
}

export interface ShopToolResult {
  output: string | any[];
  summary?: string;
  endTurn?: boolean;
}

type Impl = (args: any, ctx: ShopToolCtx) => Promise<ShopToolResult>;

interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  activity: ActivityKind;
  label: string;
  impl: Impl;
}

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});

function json(data: unknown): string {
  let out = JSON.stringify(data, null, 0);
  if (out.length > 60000) out = out.slice(0, 60000) + '…(truncated)';
  return out;
}

function showProducts(ctx: ShopToolCtx, products: ReturnType<typeof browseCatalog>, title: string) {
  if (products.length) {
    appendRow(ctx.botId, 'card', {
      type: 'card',
      card: 'products',
      title,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        image: p.image,
        blurb: p.blurb,
        inStock: p.inStock,
        rating: p.rating,
      })),
    });
  }
}

function showCart(ctx: ShopToolCtx, cart: ReturnType<typeof getCart>) {
  appendRow(ctx.botId, 'card', {
    type: 'card',
    card: 'cart',
    title: 'Your cart',
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    items: cart.items.map((i) => ({
      productId: i.productId,
      name: i.product.name,
      qty: i.qty,
      lineTotal: i.lineTotal,
      image: i.product.image,
      variant: i.variant,
    })),
  });
}

export const SHOP_TOOLS: ToolDef[] = [
  {
    name: 'shop_store_info',
    description: 'Get store metadata: name, categories, product count, and demo-payment notice.',
    parameters: obj({}),
    activity: 'working',
    label: 'Checking the store',
    impl: async () => ({ output: json(storeMeta()), summary: 'Store info' }),
  },
  {
    name: 'shop_search_products',
    description: 'Search or browse the product catalog. Use a free-text query and optional category/tag filters. Shows product cards in chat.',
    parameters: obj({
      query: { type: 'string', description: 'Search text, e.g. "hoodie", "gift under 50", "desk"' },
      category: { type: 'string', description: 'Optional exact category: Apparel, Accessories, Bags, Footwear, Home' },
      tag: { type: 'string', description: 'Optional tag like bestseller, gift, travel, basics' },
      max: { type: 'integer', description: 'Max results (default 6, max 12)' },
    }),
    activity: 'searching_web',
    label: 'Searching the catalog',
    impl: async (a, ctx) => {
      const max = Math.max(1, Math.min(12, Number(a.max) || 6));
      const products = browseCatalog(String(a.query ?? ''), a.category ? String(a.category) : undefined, a.tag ? String(a.tag) : undefined, max);
      const title = a.query ? `Results for “${a.query}”` : a.category ? a.category : 'Featured products';
      showProducts(ctx, products, title);
      return { output: json({ count: products.length, products }), summary: `${products.length} products` };
    },
  },
  {
    name: 'shop_get_product',
    description: 'Get full details for one product by id (e.g. nl-tee-01).',
    parameters: obj({ product_id: { type: 'string' } }, ['product_id']),
    activity: 'working',
    label: 'Looking up a product',
    impl: async (a, ctx) => {
      const product = productDetail(String(a.product_id));
      if (!product) return { output: json({ error: 'Product not found' }), summary: 'Not found' };
      showProducts(ctx, [product], product.name);
      return { output: json(product), summary: product.name };
    },
  },
  {
    name: 'shop_get_cart',
    description: 'Show the shopper’s current cart contents and subtotal.',
    parameters: obj({}),
    activity: 'working',
    label: 'Checking the cart',
    impl: async (_a, ctx) => {
      const cart = getCart(ctx.userId);
      showCart(ctx, cart);
      return { output: json(cart), summary: `${cart.itemCount} items` };
    },
  },
  {
    name: 'shop_add_to_cart',
    description: 'Add a product to the cart. Optional color/size variant when the product supports them.',
    parameters: obj({
      product_id: { type: 'string' },
      qty: { type: 'integer', description: 'Quantity to add (default 1)' },
      color: { type: 'string' },
      size: { type: 'string' },
    }, ['product_id']),
    activity: 'working',
    label: 'Adding to cart',
    impl: async (a, ctx) => {
      try {
        const variant: Record<string, string> = {};
        if (a.color) variant.color = String(a.color);
        if (a.size) variant.size = String(a.size);
        const cart = addToCart(ctx.userId, String(a.product_id), Number(a.qty) || 1, variant);
        showCart(ctx, cart);
        return { output: json({ ok: true, cart }), summary: 'Added to cart' };
      } catch (e) {
        return { output: json({ ok: false, error: (e as Error).message }), summary: 'Could not add' };
      }
    },
  },
  {
    name: 'shop_update_cart',
    description: 'Set the quantity for a cart line. Use qty 0 to remove the item.',
    parameters: obj({ product_id: { type: 'string' }, qty: { type: 'integer' } }, ['product_id', 'qty']),
    activity: 'working',
    label: 'Updating the cart',
    impl: async (a, ctx) => {
      try {
        const cart = updateCartQty(ctx.userId, String(a.product_id), Number(a.qty));
        showCart(ctx, cart);
        return { output: json({ ok: true, cart }), summary: 'Cart updated' };
      } catch (e) {
        return { output: json({ ok: false, error: (e as Error).message }), summary: 'Update failed' };
      }
    },
  },
  {
    name: 'shop_clear_cart',
    description: 'Remove every item from the cart.',
    parameters: obj({}),
    activity: 'working',
    label: 'Clearing the cart',
    impl: async (_a, ctx) => {
      const cart = clearCart(ctx.userId);
      showCart(ctx, cart);
      return { output: json({ ok: true, cart }), summary: 'Cart cleared' };
    },
  },
  {
    name: 'shop_checkout',
    description: 'Place a mock order from the current cart. No real payment is charged. Collect a shipping name/address when possible.',
    parameters: obj({
      shipping_name: { type: 'string' },
      shipping_address: { type: 'string' },
      note: { type: 'string' },
    }),
    activity: 'working',
    label: 'Placing the order',
    impl: async (a, ctx) => {
      try {
        const order = placeOrder(ctx.userId, {
          shippingName: a.shipping_name ? String(a.shipping_name) : undefined,
          shippingAddress: a.shipping_address ? String(a.shipping_address) : undefined,
          note: a.note ? String(a.note) : undefined,
        });
        appendRow(ctx.botId, 'card', {
          type: 'card',
          card: 'order',
          title: 'Order placed',
          orderId: order.id,
          status: order.status,
          total: order.total,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
        });
        return { output: json({ ok: true, order, notice: 'Demo checkout only — no payment charged.' }), summary: `Order ${order.id}` };
      } catch (e) {
        return { output: json({ ok: false, error: (e as Error).message }), summary: 'Checkout failed' };
      }
    },
  },
  {
    name: 'shop_list_orders',
    description: 'List recent orders for this shopper.',
    parameters: obj({ limit: { type: 'integer' } }),
    activity: 'working',
    label: 'Checking orders',
    impl: async (a, ctx) => {
      const orders = listOrders(ctx.userId, Math.max(1, Math.min(20, Number(a.limit) || 10)));
      return { output: json({ orders }), summary: `${orders.length} orders` };
    },
  },
  {
    name: 'shop_get_order',
    description: 'Get one order by id, including status and line items.',
    parameters: obj({ order_id: { type: 'string' } }, ['order_id']),
    activity: 'working',
    label: 'Looking up an order',
    impl: async (a, ctx) => {
      const order = getOrder(ctx.userId, String(a.order_id));
      if (!order) return { output: json({ error: 'Order not found' }), summary: 'Not found' };
      appendRow(ctx.botId, 'card', {
        type: 'card',
        card: 'order',
        title: `Order ${order.id}`,
        orderId: order.id,
        status: order.status,
        total: order.total,
        itemCount: Array.isArray(order.items) ? order.items.length : 0,
      });
      return { output: json(order), summary: order.status };
    },
  },
  {
    name: 'shop_advance_order_demo',
    description: 'Demo-only: advance an order one step along placed → packing → shipped → delivered for support walkthroughs.',
    parameters: obj({ order_id: { type: 'string' } }, ['order_id']),
    activity: 'working',
    label: 'Updating order status',
    impl: async (a, ctx) => {
      try {
        const order = advanceOrderDemo(ctx.userId, String(a.order_id));
        appendRow(ctx.botId, 'card', {
          type: 'card',
          card: 'order',
          title: `Order ${order.id}`,
          orderId: order.id,
          status: order.status,
          total: order.total,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
        });
        return { output: json({ ok: true, order }), summary: order.status };
      } catch (e) {
        return { output: json({ ok: false, error: (e as Error).message }), summary: 'Update failed' };
      }
    },
  },
  {
    name: 'shop_faq',
    description: 'Look up store FAQ answers (shipping, returns, payments, sizing, tracking).',
    parameters: obj({ query: { type: 'string', description: 'Customer question or keywords' } }, ['query']),
    activity: 'working',
    label: 'Checking FAQ',
    impl: async (a) => {
      const hits = faqLookup(String(a.query));
      return { output: json({ hits }), summary: hits.length ? hits[0].q : 'No FAQ hit' };
    },
  },
];

export const shopToolMap = new Map(SHOP_TOOLS.map((t) => [t.name, t]));
