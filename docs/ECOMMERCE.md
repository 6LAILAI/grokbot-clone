# Grokbot for ecommerce design services

Grokbot is the open-source Grok Bot–style runtime (chat UI, agent loop, tools, memory, optional computer/apps/voice), specialized here for **ecommerce design studios/agencies** that help merchants with store and product presentation — not a consumer retail checkout bot.

## What it is for

- Product presentation & merchandising critique (titles, blurbs, imagery, category structure)
- Lookbook / selection bags staged from the **real merchant catalog**
- Catalog data gaps (missing images, thin copy, odd stock)
- Store FAQ/policy copy review for design work
- Optional computer/apps/voice for research and deliverables

Primary Bot defaults to **Studio**. Cart/checkout APIs stage **design-review sheets** (no PSP charge).

## Catalog integration (real products)

Canonical store: **SQLite** (`shop_products` / `shop_faq`).

| Source | How |
| --- | --- |
| **JSON feed** | `CATALOG_FEED_URL` (+ optional `CATALOG_FEED_TOKEN`); boot sync; optional `CATALOG_SYNC_INTERVAL_MS` |
| **CSV file** | `CATALOG_CSV_PATH`, or `npm run catalog:import -- ./data/your-catalog.csv` |
| **API** | `POST /api/shop/catalog/import-csv`, `POST /api/shop/catalog/sync` |
| **Demo seed** | Only if DB empty and no feed/CSV (`CATALOG_SEED_DEMO=1`) |

Samples: `data/catalog.sample.csv`, `data/catalog.sample.json`.

### CSV columns

`id,name,brand,category,price_cents,compare_at_cents,currency,rating,review_count,in_stock,colors,sizes,tags,blurb,image`

### JSON feed shape

```json
{
  "store": { "name": "Acme", "currency": "USD" },
  "products": [ { "id": "sku-1", "name": "...", "price_cents": 1999, "in_stock": 12 } ],
  "faq": [ { "id": "ship-1", "q": "...", "a": "..." } ]
}
```

## Configure

```bash
cp .env.example .env
# XAI_API_KEY, SESSION_SECRET, STORE_NAME="Client Catalog"
# CATALOG_FEED_URL=…  or  CATALOG_CSV_PATH=./data/catalog.sample.csv
npm ci
npm run catalog:import -- ./data/catalog.sample.csv
npm run dev -w server
npm run dev -w web
```

## Still needed from the studio / merchant

1. Merchant product feed (HTTPS JSON) **or** CSV export  
2. Optional feed Bearer token  
3. Engagement/store label (`STORE_NAME`)  
4. Optional later: PSP if the studio needs real checkout (not required for design workflows)

## Key files

| Area | Path |
| --- | --- |
| Design-service prompt | `server/src/agent/prompt.ts` |
| Catalog facade | `server/src/ecommerce/catalog.ts` |
| SQLite products | `server/src/ecommerce/catalog-db.ts` |
| CSV / feed parsers | `server/src/ecommerce/catalog-import.ts` |
| Tools | `server/src/ecommerce/tools.ts` |
| Samples | `data/catalog.sample.*` |
