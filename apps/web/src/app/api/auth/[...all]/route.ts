import { getAuth } from "@crm/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Lazy: getAuth() needs env vars that don't exist at `next build` page-data
// collection time.
export const { GET, POST } = toNextJsHandler((request) => getAuth().handler(request));
