import { redirect } from "next/navigation";

// Reads the session → must never be prerendered at build time.
export const dynamic = "force-dynamic";

import { getSession } from "@/server/tenant";

export default async function Home() {
  const session = await getSession();
  redirect(session ? "/app" : "/sign-in");
}
