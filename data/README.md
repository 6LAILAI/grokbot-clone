# Merchant catalog samples

Grokbot for **ecommerce design services** loads merchant products into SQLite from a **CSV file** or **JSON feed** for presentation and merchandising work.

- `catalog.sample.csv` — CSV import via `CATALOG_CSV_PATH` or `npm run catalog:import -- ./data/catalog.sample.csv`
- `catalog.sample.json` — example feed body for `CATALOG_FEED_URL` (or import with the CLI)

See `docs/ECOMMERCE.md` for column/feed shape and env vars.
