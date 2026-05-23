export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  REFRESH_TOKEN?: string;
  HISTORY_MONTHS?: string;
  SCRAPE_DELAY_MS?: string;
  IPOSEEK_COOKIE?: string;
  IPOSEEK_ACCESS_TOKEN?: string;
  IPOSEEK_DEVICE_FINGERPRINT?: string;
}
