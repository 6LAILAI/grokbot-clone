function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function opt(name: string): string {
  return process.env[name]?.trim() ?? '';
}

export const env = {
  port: Number(process.env.PORT ?? 8787),
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  /** Public URL of this server, used for OAuth callbacks. */
  serverUrl: process.env.SERVER_URL ?? `http://localhost:${process.env.PORT ?? 8787}`,
  xaiKey: req('XAI_API_KEY'),
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
  sessionSecret: req('SESSION_SECRET'),
  devLogin: process.env.DEV_LOGIN === '1',
  dbPath: process.env.DB_PATH ?? new URL('../../data/grokbot.db', import.meta.url).pathname,
  /** Prefer shopping tools + retail prompt tone (default on). */
  ecommerceMode: process.env.ECOMMERCE_MODE !== '0',
};
