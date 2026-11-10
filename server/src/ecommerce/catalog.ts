/** Mock retail catalog + FAQ for the shopping assistant. No external APIs. */

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceCents: number;
  compareAtCents?: number;
  currency: 'USD';
  rating: number;
  reviewCount: number;
  inStock: number;
  colors?: string[];
  sizes?: string[];
  tags: string[];
  blurb: string;
  image: string;
}

export const STORE_NAME = 'Northline Shop';

export const PRODUCTS: Product[] = [
  {
    id: 'nl-tee-01',
    name: 'Everyday Cotton Tee',
    brand: 'Northline',
    category: 'Apparel',
    priceCents: 2800,
    compareAtCents: 3600,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 214,
    inStock: 48,
    colors: ['ink', 'sand', 'bone'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    tags: ['bestseller', 'basics', 'gift'],
    blurb: 'Soft midweight tee with a clean crew neck. Built for daily wear.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640&q=80',
  },
  {
    id: 'nl-hoodie-02',
    name: 'Trail Fleece Hoodie',
    brand: 'Northline',
    category: 'Apparel',
    priceCents: 7800,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 97,
    inStock: 22,
    colors: ['forest', 'slate'],
    sizes: ['S', 'M', 'L', 'XL'],
    tags: ['outerwear', 'gift'],
    blurb: 'Brushed fleece hoodie with kangaroo pocket and reinforced cuffs.',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=640&q=80',
  },
  {
    id: 'nl-cap-03',
    name: 'Soft Peak Cap',
    brand: 'Northline',
    category: 'Accessories',
    priceCents: 3200,
    currency: 'USD',
    rating: 4.4,
    reviewCount: 61,
    inStock: 35,
    colors: ['black', 'olive'],
    tags: ['accessories', 'gift'],
    blurb: 'Unstructured cap with a soft peak and tonal embroidery.',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=640&q=80',
  },
  {
    id: 'nl-bottle-04',
    name: 'Daypack Bottle 750ml',
    brand: 'Field & Form',
    category: 'Home',
    priceCents: 3600,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 188,
    inStock: 60,
    colors: ['steel', 'matte black'],
    tags: ['hydration', 'travel'],
    blurb: 'Insulated stainless bottle that keeps drinks cold for 24 hours.',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=640&q=80',
  },
  {
    id: 'nl-mug-05',
    name: 'Stoneware Desk Mug',
    brand: 'Field & Form',
    category: 'Home',
    priceCents: 2400,
    currency: 'USD',
    rating: 4.5,
    reviewCount: 132,
    inStock: 40,
    colors: ['clay', 'cream'],
    tags: ['desk', 'gift'],
    blurb: 'Hand-glazed 12oz mug with a wide, stable base.',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcc036?w=640&q=80',
  },
  {
    id: 'nl-bag-06',
    name: 'Compact Crossbody',
    brand: 'Northline',
    category: 'Bags',
    priceCents: 8900,
    compareAtCents: 11000,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 76,
    inStock: 18,
    colors: ['cognac', 'black'],
    tags: ['bags', 'travel', 'bestseller'],
    blurb: 'Slim crossbody with padded strap and RFID-safe pocket.',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=640&q=80',
  },
  {
    id: 'nl-shoe-07',
    name: 'City Walker Sneaker',
    brand: 'Pace Co',
    category: 'Footwear',
    priceCents: 12800,
    currency: 'USD',
    rating: 4.3,
    reviewCount: 203,
    inStock: 27,
    colors: ['white', 'navy'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    tags: ['footwear', 'bestseller'],
    blurb: 'Lightweight daily sneaker with cushioned insole and gum sole.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=640&q=80',
  },
  {
    id: 'nl-sock-08',
    name: 'Merino Crew Socks (3-pack)',
    brand: 'Pace Co',
    category: 'Apparel',
    priceCents: 2200,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 154,
    inStock: 90,
    sizes: ['S/M', 'L/XL'],
    tags: ['basics', 'gift'],
    blurb: 'Breathable merino blend that stays soft wash after wash.',
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=640&q=80',
  },
  {
    id: 'nl-lamp-09',
    name: 'Arc Desk Lamp',
    brand: 'Field & Form',
    category: 'Home',
    priceCents: 6400,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 89,
    inStock: 15,
    colors: ['brass', 'matte black'],
    tags: ['desk', 'lighting'],
    blurb: 'Adjustable LED desk lamp with warm/cool modes and USB-C charge port.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=640&q=80',
  },
  {
    id: 'nl-candle-10',
    name: 'Cedar Room Candle',
    brand: 'Hearth',
    category: 'Home',
    priceCents: 2900,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 241,
    inStock: 55,
    tags: ['gift', 'home'],
    blurb: 'Soy wax candle with cedar, smoke, and a soft citrus top note.',
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=640&q=80',
  },
  {
    id: 'nl-watch-11',
    name: 'Field Watch 38mm',
    brand: 'Pace Co',
    category: 'Accessories',
    priceCents: 18900,
    currency: 'USD',
    rating: 4.5,
    reviewCount: 58,
    inStock: 9,
    colors: ['silver', 'black'],
    tags: ['accessories', 'gift'],
    blurb: 'Sapphire crystal field watch with quick-release leather strap.',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=640&q=80',
  },
  {
    id: 'nl-tote-12',
    name: 'Market Canvas Tote',
    brand: 'Northline',
    category: 'Bags',
    priceCents: 4200,
    currency: 'USD',
    rating: 4.4,
    reviewCount: 119,
    inStock: 44,
    colors: ['natural', 'navy'],
    tags: ['bags', 'everyday'],
    blurb: 'Heavy canvas tote with interior zip pocket and reinforced handles.',
    image: 'https://images.unsplash.com/photo-1590874103328-eac70a638e13?w=640&q=80',
  },
];

export interface FaqEntry {
  id: string;
  q: string;
  a: string;
  tags: string[];
}

export const FAQ: FaqEntry[] = [
  {
    id: 'ship-1',
    q: 'How long does shipping take?',
    a: 'Standard shipping is 3–5 business days in the continental US. Express is 1–2 business days. Orders placed after 2pm PT ship the next business day.',
    tags: ['shipping', 'delivery'],
  },
  {
    id: 'ship-2',
    q: 'Do you ship internationally?',
    a: 'This demo store ships within the US only. International shipping is on the roadmap.',
    tags: ['shipping', 'international'],
  },
  {
    id: 'return-1',
    q: 'What is the return policy?',
    a: 'Unworn items can be returned within 30 days of delivery for a full refund to the original payment method. Final-sale and personalized items are excluded.',
    tags: ['returns', 'refunds'],
  },
  {
    id: 'pay-1',
    q: 'What payment methods do you accept?',
    a: 'In this demo, checkout creates a mock order — no real payment is charged. In production you would connect Stripe or your PSP.',
    tags: ['payment', 'checkout'],
  },
  {
    id: 'track-1',
    q: 'How do I track my order?',
    a: 'Ask the shopping assistant for your order id, or say “where is my order”. Demo tracking shows status only (placed → packing → shipped → delivered).',
    tags: ['tracking', 'orders'],
  },
  {
    id: 'size-1',
    q: 'How do sizes run?',
    a: 'Apparel is true to size. If you are between sizes, size up for hoodies and size down for tees if you prefer a closer fit.',
    tags: ['sizing', 'apparel'],
  },
];

export function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export function searchProducts(query: string, opts: { category?: string; tag?: string; max?: number } = {}) {
  const max = opts.max ?? 8;
  const q = query.trim().toLowerCase();
  const words = q ? q.split(/\s+/).filter(Boolean) : [];
  let list = PRODUCTS.slice();
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

export function searchFaq(query: string, max = 4) {
  const q = query.trim().toLowerCase();
  if (!q) return FAQ.slice(0, max);
  const words = q.split(/\s+/).filter(Boolean);
  return FAQ.map((f) => {
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
    price: money(p.priceCents),
    priceCents: p.priceCents,
    compareAt: p.compareAtCents ? money(p.compareAtCents) : undefined,
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

export const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))].sort();
