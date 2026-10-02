import { getServerEnv } from "@crm/config";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase, PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";
import postgres from "postgres";

import * as schema from "./schema";

export type Schema = typeof schema;
export { schema };

export type Database = PostgresJsDatabase<Schema> & { $client: Sql };

export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT,
  Schema,
  ExtractTablesWithRelations<Schema>
>;

/** Any executor that can run queries: the pool or an open transaction. */
export type DbExecutor = Database | Transaction;

export function createDb(url: string): Database {
  const client = postgres(url, { prepare: true });
  return drizzle({ client, casing: "snake_case", schema });
}

let singleton: Database | undefined;

/** Lazy app-wide client. Always connects as crm_app (subject to RLS). */
export function getDb(): Database {
  if (!singleton) {
    singleton = createDb(getServerEnv().database.url);
  }
  return singleton;
}
