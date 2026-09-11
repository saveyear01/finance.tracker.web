/**
 * Runtime configuration, read once from Vite's env so the rest of the app
 * never touches `import.meta.env` directly.
 */
export const env = {
  /**
   * Base URL of the API. Defaults to `/api`, which the Vite dev server
   * proxies to FastAPI on :8000 (see `vite.config.ts`).
   */
  API_URL: import.meta.env.VITE_API_URL ?? '/api',
  APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Finance Tracker',
  /**
   * ISO 4217 code every amount is displayed in. One currency for the whole
   * app: fund totals add up balances across wallets, which only means
   * something if they are all in the same unit.
   */
  CURRENCY: import.meta.env.VITE_CURRENCY ?? 'PHP',
} as const
