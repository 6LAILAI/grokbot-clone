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
    title: 'Lookbook selection',
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
    description: 'Get merchant catalog metadata: store name, categories, product count, catalog source, and staging note (for ecommerce design work).',
    parameters: obj({}),
    activity: 'working',
    label: 'Checking the catalog',
    impl: async () => ({ output: json(storeMeta()), summary: 'Store info' }),
  },
  {
    name: 'shop_search_products',
    description: 'Search or browse the merchant product catalog for design/merchandising review. Optional category/tag filters. Shows product cards in chat.',
    parameters: obj({
      query: { type: 'string', description: 'Search text, e.g. "hoodie", "hero image gaps", "desk"' },
      category: { type: 'string', description: 'Optional exact category' },
      tag: { type: 'string', description: 'Optional tag like bestseller, gift, travel, basics' },
      max: { type: 'integer', description: 'Max results (default 6, max 12)' },
    }),
    activity: 'searching_web',
    label: 'Reviewing catalog products',
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
    description: 'Get full details for one merchant product by id (for presentation critique or lookbook staging).',
    parameters: obj({ product_id: { type: 'string' } }, ['product_id']),
    activity: 'working',
    label: 'Inspecting a product',
    impl: async (a, ctx) => {
      const product = productDetail(String(a.product_id));
      if (!product) return { output: json({ error: 'Product not found' }), summary: 'Not found' };
      showProducts(ctx, [product], product.name);
      return { output: json(product), summary: product.name };
    },
  },
  {
    name: 'shop_get_cart',
    description: 'Show the staged lookbook/selection bag (curated SKUs for a design review) and subtotal.',
    parameters: obj({}),
    activity: 'working',
    label: 'Checking the selection bag',
    impl: async (_a, ctx) => {
      const cart = getCart(ctx.userId);
      showCart(ctx, cart);
      return { output: json(cart), summary: `${cart.itemCount} items` };
    },
  },
  {
    name: 'shop_add_to_cart',
    description: 'Stage a product into the lookbook/selection bag for a client presentation. Optional color/size variant.',
    parameters: obj({
      product_id: { type: 'string' },
      qty: { type: 'integer', description: 'Quantity to stage (default 1)' },
      color: { type: 'string' },
      size: { type: 'string' },
    }, ['product_id']),
    activity: 'working',
    label: 'Staging a product',
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
    description: 'Set quantity for a staged selection line. Use qty 0 to remove it from the lookbook bag.',
    parameters: obj({ product_id: { type: 'string' }, qty: { type: 'integer' } }, ['product_id', 'qty']),
    activity: 'working',
    label: 'Updating the selection bag',
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
    description: 'Clear the staged lookbook/selection bag.',
    parameters: obj({}),
    activity: 'working',
    label: 'Clearing the selection bag',
    impl: async (_a, ctx) => {
      const cart = clearCart(ctx.userId);
      showCart(ctx, cart);
      return { output: json({ ok: true, cart }), summary: 'Cart cleared' };
    },
  },
  {
    name: 'shop_checkout',
    description: 'Save the staged selection bag as a named design-review order sheet. No payment is charged. Optional client/label fields via shipping_name/note.',
    parameters: obj({
      shipping_name: { type: 'string', description: 'Optional client or lookbook label' },
      shipping_address: { type: 'string', description: 'Optional project notes / delivery context' },
      note: { type: 'string', description: 'Design brief or selection notes' },
    }),
    activity: 'working',
    label: 'Saving staged sheet',
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
          title: 'Staged design sheet',
          orderId: order.id,
          status: order.status,
          total: order.total,
          itemCount: Array.isArray(order.items) ? order.items.length : 0,
        });
        return { output: json({ ok: true, order, notice: 'Staged design sheet only — no payment charged.' }), summary: `Sheet ${order.id}` };
      } catch (e) {
        return { output: json({ ok: false, error: (e as Error).message }), summary: 'Staging failed' };
      }
    },
  },
  {
    name: 'shop_list_orders',
    description: 'List recent staged design-review sheets for this engagement.',
    parameters: obj({ limit: { type: 'integer' } }),
    activity: 'working',
    label: 'Checking staged sheets',
    impl: async (a, ctx) => {
      const orders = listOrders(ctx.userId, Math.max(1, Math.min(20, Number(a.limit) || 10)));
      return { output: json({ orders }), summary: `${orders.length} orders` };
    },
  },
  {
    name: 'shop_get_order',
    description: 'Get one staged design sheet by id, including status and line items.',
    parameters: obj({ order_id: { type: 'string' } }, ['order_id']),
    activity: 'working',
    label: 'Looking up a staged sheet',
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
    description: 'Demo-only: advance a staged sheet along placed → packing → shipped → delivered (useful when simulating fulfillment copy for store design).',
    parameters: obj({ order_id: { type: 'string' } }, ['order_id']),
    activity: 'working',
    label: 'Updating sheet status',
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
    description: 'Look up merchant store FAQ / policy copy (shipping, returns, payments, sizing) for design or content review.',
    parameters: obj({ query: { type: 'string', description: 'Topic or keywords' } }, ['query']),
    activity: 'working',
    label: 'Checking store FAQ copy',
    impl: async (a) => {
      const hits = faqLookup(String(a.query));
      return { output: json({ hits }), summary: hits.length ? hits[0].q : 'No FAQ hit' };
    },
  },
];

export const shopToolMap = new Map(SHOP_TOOLS.map((t) => [t.name, t]));
