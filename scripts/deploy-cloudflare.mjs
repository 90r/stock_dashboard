import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "korea_memory_monitor";
const CONFIG_FILE = "wrangler.toml";
const PLACEHOLDER_DB_ID = "replace-with-your-d1-database-id";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Deploy this project to Cloudflare Workers.

Usage:
  npm run deploy:cloudflare

What it does:
  1. Checks Wrangler authentication.
  2. Creates the D1 database if wrangler.toml still has the placeholder database_id.
  3. Runs tests.
  4. Applies remote D1 migrations.
  5. Builds and deploys the Worker.
`);
  process.exit(0);
}

function run(command, args, options = {}) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32", ...options });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" });
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function configText() {
  return readFileSync(CONFIG_FILE, "utf8");
}

function hasConfiguredD1() {
  return !configText().includes(PLACEHOLDER_DB_ID);
}

function writeD1DatabaseId(databaseId) {
  const current = configText();
  writeFileSync(CONFIG_FILE, current.replace(PLACEHOLDER_DB_ID, databaseId));
}

run("npx", ["wrangler", "whoami"]);

if (!hasConfiguredD1()) {
  const output = runCapture("npx", ["wrangler", "d1", "create", DB_NAME, "--binding", "DB", "--update-config"]);
  if (!hasConfiguredD1()) {
    const match = output.match(/database_id\s*=\s*"([0-9a-f-]{36})"/i);
    if (!match) {
      console.error("\nCould not find the created D1 database_id in Wrangler output.");
      console.error(`Open ${CONFIG_FILE} and replace ${PLACEHOLDER_DB_ID} manually, then rerun this command.`);
      process.exit(1);
    }
    writeD1DatabaseId(match[1]);
  }
}

run("npm", ["test"]);
run("npm", ["run", "db:migrate:remote"]);
run("npm", ["run", "build"]);
run("npx", ["wrangler", "deploy"]);

console.log("\nDeploy complete. Run a first refresh after deploy:");
console.log("npm run backfill:local-upload -- --months=24");
