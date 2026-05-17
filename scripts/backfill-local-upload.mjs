import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DB_NAME = "korea_memory_monitor";
const DEFAULT_MONTHS = 24;
const LOCAL_D1_DIR = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
const TABLES_TO_REPLACE = ["customs_monthly", "stock_monthly", "exchange_rate_monthly", "refresh_log"];

const args = parseArgs(process.argv.slice(2));

if (args.has("help") || args.has("h")) {
  console.log(`Upload local D1 history to the remote Cloudflare D1 database.

Usage:
  npm run backfill:local-upload -- --months=24
  npm run backfill:local-upload -- --end-month=2026-04 --months=24
  npm run backfill:local-upload -- --local-db=.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<file>.sqlite

Options:
  --database   Remote D1 database name. Default: ${DB_NAME}
  --local-db   Local sqlite file to upload from. Default: auto-detect the non-empty local D1 file
  --end-month  Last month to upload, YYYY-MM. Default: latest month with FX data in local D1
  --months     Number of months to upload. Default: ${DEFAULT_MONTHS}
  --dry-run    Read and validate local data without modifying remote D1

This script treats local D1 as the source of truth. Before upload it deletes rows
from customs_monthly, stock_monthly, exchange_rate_monthly, and refresh_log in the
remote D1 database, then inserts the selected local months.
`);
  process.exit(0);
}

const databaseName = String(args.get("database") ?? DB_NAME);
const monthCount = positiveInt(args.get("months"), DEFAULT_MONTHS);
const localDbPath = resolve(String(args.get("local-db") ?? findLocalD1Database()));
const dryRun = args.has("dry-run");

if (!existsSync(localDbPath)) {
  fail(`Local D1 sqlite file not found: ${localDbPath}`);
}

const db = new DatabaseSync(localDbPath, { readOnly: true });
try {
  assertSchema(db);

  const availableFxMonths = db
    .prepare("SELECT month FROM exchange_rate_monthly ORDER BY month")
    .all()
    .map((row) => row.month);
  if (availableFxMonths.length === 0) {
    fail("Local D1 has no exchange_rate_monthly rows; refusing to upload an empty or partial database.");
  }

  const endMonth = String(args.get("end-month") ?? availableFxMonths.at(-1));
  validateMonth(endMonth, "--end-month");
  const months = monthRangeEnding(endMonth, monthCount);
  const startedAt = new Date().toISOString();

  const data = readLocalData(db, months);
  assertUploadData(data, months);

  const summary = summarizeData(data, months);
  printSummary(localDbPath, databaseName, summary, dryRun);

  if (dryRun) {
    process.exit(0);
  }

  executeRemoteSql(databaseName, buildReplaceSql(data, months, startedAt));
  console.log(`\nUploaded ${months.length} months to remote D1: ${months[0]} to ${months.at(-1)}`);
} finally {
  db.close();
}

function parseArgs(argv) {
  return new Map(
    argv.map((arg) => {
      const [key, ...value] = arg.replace(/^--/, "").split("=");
      return [key, value.join("=") || "true"];
    })
  );
}

function findLocalD1Database() {
  if (!existsSync(LOCAL_D1_DIR)) {
    fail(`Local D1 directory not found: ${LOCAL_D1_DIR}`);
  }

  const candidates = readdirSync(LOCAL_D1_DIR)
    .filter((name) => name.endsWith(".sqlite"))
    .map((name) => join(LOCAL_D1_DIR, name));

  const scored = [];
  for (const candidate of candidates) {
    let db;
    try {
      db = new DatabaseSync(candidate, { readOnly: true });
      const tables = listTables(db);
      if (!TABLES_TO_REPLACE.every((table) => tables.includes(table))) {
        continue;
      }
      const customsRows = db.prepare("SELECT COUNT(*) AS count FROM customs_monthly").get().count;
      const stockRows = db.prepare("SELECT COUNT(*) AS count FROM stock_monthly").get().count;
      const fxRows = db.prepare("SELECT COUNT(*) AS count FROM exchange_rate_monthly").get().count;
      scored.push({ candidate, score: Number(customsRows) + Number(stockRows) + Number(fxRows) });
    } catch {
      // Ignore sqlite files that are not this project's D1 database.
    } finally {
      db?.close();
    }
  }

  scored.sort((a, b) => b.score - a.score);
  if (!scored[0] || scored[0].score === 0) {
    fail(`Could not auto-detect a non-empty local D1 database in ${LOCAL_D1_DIR}. Pass --local-db=<path>.`);
  }

  return scored[0].candidate;
}

function listTables(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
    .all()
    .map((row) => row.name);
}

function assertSchema(db) {
  const tables = listTables(db);
  const missing = TABLES_TO_REPLACE.filter((table) => !tables.includes(table));
  if (missing.length > 0) {
    fail(`Local D1 is missing required table(s): ${missing.join(", ")}`);
  }
}

function readLocalData(db, months) {
  const placeholders = months.map(() => "?").join(", ");
  const customs = db
    .prepare(
      `SELECT category, month, scope, destination_code, destination_name, hsk_code,
              export_usd, export_kg, import_usd, import_kg, unit_usd_per_kg, source, updated_at
       FROM customs_monthly
       WHERE month IN (${placeholders})
       ORDER BY month, category, scope, destination_code`
    )
    .all(...months);
  const stocks = db
    .prepare(
      `SELECT symbol, month, trade_date, close_krw, volume, source, updated_at
       FROM stock_monthly
       WHERE month IN (${placeholders})
       ORDER BY month, symbol`
    )
    .all(...months);
  const exchangeRates = db
    .prepare(
      `SELECT month, rate_date, usd_cny, cny_krw, source, updated_at
       FROM exchange_rate_monthly
       WHERE month IN (${placeholders})
       ORDER BY month`
    )
    .all(...months);

  return { customs, stocks, exchangeRates };
}

function assertUploadData(data, months) {
  const customsByMonth = countBy(data.customs, "month");
  const stocksByMonth = countBy(data.stocks, "month");
  const fxByMonth = countBy(data.exchangeRates, "month");
  const missing = [];

  for (const month of months) {
    if ((customsByMonth.get(month) ?? 0) < 3) {
      missing.push(`${month}: customs rows < 3`);
    }
    if ((stocksByMonth.get(month) ?? 0) < 2) {
      missing.push(`${month}: stock rows < 2`);
    }
    if ((fxByMonth.get(month) ?? 0) < 1) {
      missing.push(`${month}: missing exchange rate`);
    }
  }

  if (missing.length > 0) {
    fail(`Local D1 data is incomplete; refusing to replace remote data.\n${missing.join("\n")}`);
  }
}

function summarizeData(data, months) {
  return {
    monthFrom: months[0],
    monthTo: months.at(-1),
    months: months.length,
    customsRows: data.customs.length,
    stockRows: data.stocks.length,
    exchangeRateRows: data.exchangeRates.length
  };
}

function printSummary(localDbPath, databaseName, summary, dryRun) {
  console.log("\nLocal D1 source:");
  console.log(localDbPath);
  console.log("\nRemote D1 target:");
  console.log(databaseName);
  console.log("\nUpload window:");
  console.log(`${summary.monthFrom} to ${summary.monthTo} (${summary.months} months)`);
  console.log("\nRows to upload:");
  console.log(`customs_monthly: ${summary.customsRows}`);
  console.log(`stock_monthly: ${summary.stockRows}`);
  console.log(`exchange_rate_monthly: ${summary.exchangeRateRows}`);
  console.log("\nRemote replace scope:");
  console.log(TABLES_TO_REPLACE.join(", "));
  if (dryRun) {
    console.log("\nDry run only. Remote D1 was not modified.");
  }
}

function buildReplaceSql(data, months, startedAt) {
  const finishedAt = new Date().toISOString();
  const statements = [];

  for (const table of TABLES_TO_REPLACE) {
    statements.push(`DELETE FROM ${table};`);
  }

  for (const row of data.customs) {
    statements.push(
      `INSERT INTO customs_monthly ` +
        `(category, month, scope, destination_code, destination_name, hsk_code, export_usd, export_kg, import_usd, import_kg, unit_usd_per_kg, source, updated_at) VALUES ` +
        `(${sqlString(row.category)}, ${sqlString(row.month)}, ${sqlString(row.scope)}, ${sqlString(row.destination_code)}, ${sqlString(
          row.destination_name
        )}, ${sqlString(row.hsk_code)}, ${sqlNumber(row.export_usd)}, ${sqlNumber(row.export_kg)}, ${sqlNumber(row.import_usd)}, ${sqlNumber(
          row.import_kg
        )}, ${sqlNumber(row.unit_usd_per_kg)}, ${sqlString(row.source ?? "K-stat/KITA")}, ${sqlString(row.updated_at)});`
    );
  }

  for (const row of data.stocks) {
    statements.push(
      `INSERT INTO stock_monthly ` +
        `(symbol, month, trade_date, close_krw, volume, source, updated_at) VALUES ` +
        `(${sqlString(row.symbol)}, ${sqlString(row.month)}, ${sqlString(row.trade_date)}, ${sqlNumber(row.close_krw)}, ${sqlNumber(
          row.volume
        )}, ${sqlString(row.source ?? "Naver Finance")}, ${sqlString(row.updated_at)});`
    );
  }

  for (const row of data.exchangeRates) {
    statements.push(
      `INSERT INTO exchange_rate_monthly ` +
        `(month, rate_date, usd_cny, cny_krw, source, updated_at) VALUES ` +
        `(${sqlString(row.month)}, ${sqlString(row.rate_date)}, ${sqlNumber(row.usd_cny)}, ${sqlNumber(row.cny_krw)}, ${sqlString(
          row.source ?? "Frankfurter"
        )}, ${sqlString(row.updated_at)});`
    );
  }

  const message = `Uploaded local D1 data: ${months.length} months, ${data.customs.length} customs rows, ${data.stocks.length} stock rows, ${data.exchangeRates.length} exchange-rate rows`;
  statements.push(
    `INSERT INTO refresh_log (kind, status, started_at, finished_at, month_from, month_to, message) VALUES ` +
      `('snapshot', 'success', ${sqlString(startedAt)}, ${sqlString(finishedAt)}, ${sqlString(months[0])}, ${sqlString(months.at(-1))}, ${sqlString(
        message
      )});`
  );
  return statements.join("\n");
}

function executeRemoteSql(databaseName, sql) {
  const tempDir = mkdtempSync(join(tmpdir(), "dram-d1-upload-"));
  const sqlFile = join(tempDir, "replace-remote.sql");

  try {
    writeFileSync(sqlFile, sql);
    const command = ["wrangler", "d1", "execute", databaseName, "--remote", "--yes", "--file", sqlFile];
    console.log(`\n$ npx ${command.join(" ")}`);
    const result = spawnSync("npx", command, {
      stdio: "inherit",
      shell: process.platform === "win32"
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  }
  return counts;
}

function positiveInt(value, fallback) {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function monthRangeEnding(endMonth, count) {
  const result = [];
  let cursor = addMonths(endMonth, -(count - 1));
  while (cursor <= endMonth) {
    result.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return result;
}

function addMonths(month, delta) {
  const [year, monthNumber] = month.split("-").map(Number);
  return formatMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)));
}

function formatMonth(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function validateMonth(month, label) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    fail(`${label} must be YYYY-MM, got: ${month}`);
  }
}

function sqlString(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "NULL";
  }
  return String(number);
}

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}
