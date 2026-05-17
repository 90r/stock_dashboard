export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  REFRESH_TOKEN?: string;
  HISTORY_MONTHS?: string;
  SCRAPE_DELAY_MS?: string;
}
