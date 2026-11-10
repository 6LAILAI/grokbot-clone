function opt(name: string): string {
  return process.env[name]?.trim() ?? '';
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  /** Public URL of this server, used for OAuth callbacks. */
  serverUrl: process.env.SERVER_URL ?? `http://localhost:${process.env.PORT ?? 8787}`,
  /** Required to run the agent server; optional for catalog import CLI. */
  xaiKey: opt('XAI_API_KEY'),
  xaiModel: process.env.XAI_MODEL ?? 'grok-4.7',
  /** Optional: app connections + Google sign-in. Shopping tools work without it. */
  composioKey: opt('COMPOSIO_API_KEY'),
  /** Optional: cloud computer use. Shopping assistant works without it. */
  orgoKey: opt('ORGO_API_KEY'),
  /** Orgo workspace that holds every user's box. */
  orgoWorkspaceId: process.env.ORGO_WORKSPACE_ID ?? '',
  /** Orgo box size for new users. */
  orgoRamGb: Number(process.env.ORGO_RAM_GB ?? 8),
  orgoCpu: Number(process.env.ORGO_CPU ?? 2),
  orgoResolution: process.env.ORGO_RESOLUTION ?? '1280x800x24',
  /** Required to run the agent server; optional for catalog import CLI. */
  sessionSecret: opt('SESSION_SECRET'),
  devLogin: process.env.DEV_LOGIN === '1',
  dbPath: process.env.DB_PATH ?? new URL('../../data/grokbot.db', import.meta.url).pathname,
  /** Ecommerce design-services mode: catalog tools + studio prompt (default on). */
  ecommerceMode: process.env.ECOMMERCE_MODE !== '0',
  /** Merchant catalog / engagement name shown in chat + Catalog panel. */
  storeName: opt('STORE_NAME') || 'Merchant Catalog',
  storeCurrency: opt('STORE_CURRENCY') || 'USD',
  /** HTTPS JSON catalog feed. Shape: { store?, products: [...], faq? } or a bare product array. */
  catalogFeedUrl: opt('CATALOG_FEED_URL'),
  /** Optional Bearer token for CATALOG_FEED_URL. */
  catalogFeedToken: opt('CATALOG_FEED_TOKEN'),
  /** Absolute or relative path to a merchant CSV catalog. Imported on boot when no feed URL. */
  catalogCsvPath: opt('CATALOG_CSV_PATH'),
  /** When the product DB is empty and no feed/CSV is set, seed a small demo catalog (default on). */
  catalogSeedDemo: process.env.CATALOG_SEED_DEMO !== '0',
  /** Optional periodic feed refresh in ms (0 = off). */
  catalogSyncIntervalMs: Number(process.env.CATALOG_SYNC_INTERVAL_MS ?? 0),
};
