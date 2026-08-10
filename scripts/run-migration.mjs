import { readFileSync } from "node:fs";
import { Client } from "pg";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const sql = readFileSync(
  new URL("../supabase/migrations/0001_init.sql", import.meta.url),
  "utf8",
);

const connectionString = process.env.POSTGRES_URL_NON_POOLING.replace(
  /\?sslmode=\w+$/,
  "",
);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log("Migration applied successfully.");
} finally {
  await client.end();
}
