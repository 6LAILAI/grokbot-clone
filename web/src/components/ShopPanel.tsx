import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from './Icon';

interface ShopProduct {
  id: string;
  name: string;
  brand: string;
  price: string;
  image: string;
  blurb: string;
  inStock: number;
  category: string;
}

interface CartView {
  itemCount: number;
  subtotal: string;
  items: { productId: string; qty: number; lineTotal: string; product: { name: string; image: string } }[];
}

export function ShopPanel() {
  const [q, setQ] = useState('');
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [cart, setCart] = useState<CartView | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async (query = '') => {
    setError(null);
    try {
      const [p, c] = await Promise.all([
        api.shopProducts(query),
        api.shopCart(),
      ]);
      setProducts(p.products as ShopProduct[]);
      setCart(c.cart as CartView);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('search');
    await load(q.trim());
    setBusy(null);
  };

  const add = async (id: string) => {
    setBusy(id);
    setError(null);
    setNote(null);
    try {
      const { cart: next } = await api.shopAdd(id, 1);
      setCart(next as CartView);
      setNote('Added to cart');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const checkout = async () => {
    setBusy('checkout');
    setError(null);
    try {
      const { order } = await api.shopCheckout();
      setNote(`Order ${order.id} placed (${order.total}) — demo only`);
      const { cart: next } = await api.shopCart();
      setCart(next as CartView);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="shop-panel">
      <div className="section-label section-label--row">
        <span>Shop</span>
        <button type="button" className="link-btn link-btn--small" onClick={() => load(q)}>Refresh</button>
      </div>
      <form className="shop-panel__search" onSubmit={search}>
        <input
          className="text-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products"
          aria-label="Search products"
        />
        <button type="submit" className="btn btn--secondary" disabled={busy === 'search'}>
          {busy === 'search' ? '…' : 'Go'}
        </button>
      </form>
      <div className="shop-panel__cart panel-card">
        <div className="shop-panel__cart-head">
          <Icon name="bag" size={14} opacity={0.6} />
          <span>{cart ? `${cart.itemCount} in cart · ${cart.subtotal}` : 'Cart'}</span>
        </div>
        {cart && cart.items.length > 0 && (
          <button type="button" className="btn btn--primary shop-panel__checkout" disabled={!!busy} onClick={checkout}>
            {busy === 'checkout' ? 'Placing…' : 'Checkout (demo)'}
          </button>
        )}
      </div>
      <div className="shop-panel__list">
        {products.map((p) => (
          <div key={p.id} className="shop-panel__item panel-card">
            <img src={p.image} alt="" className="shop-panel__thumb" loading="lazy" />
            <div className="shop-panel__info">
              <div className="shop-panel__name">{p.name}</div>
              <div className="shop-panel__meta">{p.brand} · {p.price}</div>
              <button type="button" className="btn btn--secondary btn--tiny" disabled={!!busy || p.inStock < 1} onClick={() => add(p.id)}>
                {busy === p.id ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {note && <div className="shop-panel__note">{note}</div>}
      {error && <div className="card__error">{error}</div>}
    </section>
  );
}
