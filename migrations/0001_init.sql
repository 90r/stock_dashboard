CREATE TABLE IF NOT EXISTS customs_monthly (
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'total',
  destination_code TEXT NOT NULL DEFAULT '',
  destination_name TEXT,
  hsk_code TEXT NOT NULL,
  export_usd REAL,
  export_kg REAL,
  import_usd REAL,
  import_kg REAL,
  unit_usd_per_kg REAL,
  source TEXT NOT NULL DEFAULT 'K-stat/KITA',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (category, month, scope, destination_code)
);

CREATE INDEX IF NOT EXISTS idx_customs_monthly_month
  ON customs_monthly (month);

CREATE INDEX IF NOT EXISTS idx_customs_monthly_scope
  ON customs_monthly (category, scope, month);

CREATE TABLE IF NOT EXISTS stock_monthly (
  symbol TEXT NOT NULL,
  month TEXT NOT NULL,
  trade_date TEXT NOT NULL,
  close_krw REAL NOT NULL,
  volume REAL,
  source TEXT NOT NULL DEFAULT 'Naver Finance',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (symbol, month)
);

CREATE INDEX IF NOT EXISTS idx_stock_monthly_month
  ON stock_monthly (month);

CREATE TABLE IF NOT EXISTS exchange_rate_monthly (
  month TEXT PRIMARY KEY,
  rate_date TEXT NOT NULL,
  usd_cny REAL NOT NULL,
  cny_krw REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'Frankfurter',
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_monthly_date
  ON exchange_rate_monthly (rate_date);

CREATE TABLE IF NOT EXISTS refresh_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  month_from TEXT,
  month_to TEXT,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_log_started
  ON refresh_log (started_at DESC);
