import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Same convention as packages/db/drizzle.config.ts: migrations run as the
// owner role (bypasses RLS, owns objects) via DATABASE_ADMIN_URL, falling
// back to DATABASE_URL.
const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error("migrate: DATABASE_ADMIN_URL or DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });
try {
  await migrate(drizzle(sql, { logger: false }), {
    migrationsFolder: resolve(import.meta.dirname, "migrations"),
  });
  console.log("migrate: up to date");
} catch (error) {
  console.error("migrate: failed", error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
