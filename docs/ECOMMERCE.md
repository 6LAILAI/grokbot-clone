# Ecommerce shopping assistant

This project extends [nickvasilescu/grokbot-clone](https://github.com/nickvasilescu/grokbot-clone) — an open-source Grok Bot–style runtime (chat UI, agent loop, tools, memory, optional computer/apps/voice) — into a retail shopping Bot.

## Verdict

**Yes:** upstream is a self-hosted Grok Bot clone (AG-style teammate chat + tools). This slice keeps that architecture and specializes the primary Bot for ecommerce.

## What shipped

- Mock **Northline Shop** catalog (12 products) + FAQ
- `shop_*` agent tools: search, product detail, cart, checkout, orders, FAQ
- In-chat **product / cart / order** cards
- Details-panel **Shop** browser with demo checkout
- Retail system prompt when `ECOMMERCE_MODE=1` (default)
- Default primary Bot renamed to **Shop**
- Composio + Orgo keys optional; shopping works with `XAI_API_KEY` + `SESSION_SECRET` + `DEV_LOGIN=1`

## Run

```bash
npm ci
cp .env.example .env
# set XAI_API_KEY and SESSION_SECRET (openssl rand -hex 32)
npm run dev -w server   # :8787
npm run dev -w web      # :5173
```

Sign in with the email form (`DEV_LOGIN=1`). Ask Shop things like “show bestsellers under $50” or use the side-panel Shop list.

## Key files

| Area | Path |
| --- | --- |
| Catalog / FAQ | `server/src/ecommerce/catalog.ts` |
| Cart / orders | `server/src/ecommerce/cart.ts` |
| Agent tools | `server/src/ecommerce/tools.ts` |
| REST | `server/src/routes-shop.ts` |
| Prompt | `server/src/agent/prompt.ts` |
| Cards UI | `web/src/components/cards/Cards.tsx` |
| Shop panel | `web/src/components/ShopPanel.tsx` |

## Open decisions

1. Wire a real catalog / Shopify / Stripe, or keep the mock for demos?
2. Keep Orgo/Composio as optional, or require them again for parity with upstream?
3. Brand as “Shopbot” vs keep “Grokbot” naming in more of the UI?
