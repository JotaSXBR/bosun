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
  // Ensure the least-privileged app role exists: the app connects as the
  // DATABASE_URL user, which must not be the owner (owners bypass RLS). The
  // role password is taken from DATABASE_URL itself — admin credentials only
  // exist in DATABASE_ADMIN_URL. Skipped when DATABASE_URL is absent or
  // equals the admin URL (single-user setups like local dev).
  const appUrl = process.env.DATABASE_URL;
  if (appUrl && appUrl !== url) {
    const app = new URL(appUrl);
    const role = decodeURIComponent(app.username).replaceAll('"', '""');
    const pass = decodeURIComponent(app.password).replaceAll("'", "''");
    const rows =
      await sql`select 1 from pg_roles where rolname = ${decodeURIComponent(app.username)}`;
    if (rows.length === 0) {
      await sql.unsafe(`create role "${role}" login password '${pass}' nosuperuser nobypassrls`);
      console.log(`migrate: created app role ${role}`);
    }
    const [{ db }] = await sql`select current_database() as db`;
    await sql.unsafe(
      `grant connect on database "${String(db).replaceAll('"', '""')}" to "${role}"; ` +
        `grant usage on schema public to "${role}"`,
    );
  }

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
