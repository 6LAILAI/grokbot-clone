/**
 * Merchant catalog import CLI.
 *
 *   npm run catalog:import -- ../data/catalog.sample.csv
 *   npm run catalog:import -- ../data/catalog.sample.json
 *   npm run catalog:sync
 */

import path from 'node:path';
import fs from 'node:fs';
import { catalogStatus, importCsvFile, importProducts, syncCatalogFeed } from './catalog.js';
import { parseCatalogFeed } from './catalog-import.js';
import { ensureShopTables } from './cart.js';

const args = process.argv.slice(2);
const cmd = args[0];

ensureShopTables();

async function main() {
  const file = cmd === 'import' ? args[1] : cmd;
  if (!file || file === '--help' || file === '-h') {
    console.log(`Usage:
  npm run catalog:import -- ./data/catalog.sample.csv
  npm run catalog:import -- ./data/catalog.sample.json
  npm run catalog:sync`);
    process.exit(file ? 0 : 1);
  }

  if (file === 'sync' || process.env.npm_lifecycle_event === 'catalog:sync') {
    await syncCatalogFeed({ replaceAll: true });
    console.log(catalogStatus());
    return;
  }

  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  if (abs.endsWith('.json')) {
    const feed = parseCatalogFeed(JSON.parse(fs.readFileSync(abs, 'utf8')));
    const r = importProducts(feed.products, {
      replaceAll: true,
      source: 'feed',
      store: feed.store?.name,
      currency: feed.store?.currency,
      faq: feed.faq,
    });
    console.log(r);
  } else {
    console.log(importCsvFile(abs, { replaceAll: true }));
  }
  console.log(catalogStatus());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
