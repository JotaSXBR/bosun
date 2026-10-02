import { getDb } from "@crm/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let db: "ok" | "error" = "ok";
  try {
    await getDb().execute(sql`select 1`);
  } catch {
    db = "error";
  }
  return NextResponse.json(
    { status: db === "ok" ? "ok" : "error", db },
    { status: db === "ok" ? 200 : 503 },
  );
}
