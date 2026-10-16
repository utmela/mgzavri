import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { ApiError, databaseError } from "./errors.ts";

export type Context = { db: SupabaseClient; user: User | null };

export async function context(request: Request, required = true): Promise<Context> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const expectedOrigin = process.env.SITE_URL || new URL(request.url).origin;
    if (origin && origin !== new URL(expectedOrigin).origin) throw new ApiError(403, "ORIGIN_REJECTED", "This request origin is not allowed.");
    if (process.env.MARKETPLACE_WRITES_ENABLED === "false") throw new ApiError(503, "MAINTENANCE", "Bookings and changes are temporarily paused. Please try again later.");
  }
  const authorization = request.headers.get("authorization");
  if (required && !authorization) throw new ApiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
  if (authorization && !/^Bearer \S+$/i.test(authorization)) throw new ApiError(401, "INVALID_TOKEN", "Please sign in again.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError(503, "BACKEND_UNCONFIGURED", "The booking service has not been configured.");
  // One client per request. Public key + caller JWT preserves database RLS.
  // Never substitute a service-role client here.
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: authorization ? { Authorization: authorization } : {},
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000), cache: "no-store" }),
    },
  });
  if (!authorization) return { db, user: null };
  const { data, error } = await db.auth.getUser(authorization.slice(7));
  if (error) {
    if (!error.status || error.status >= 500) throw new ApiError(503, "BACKEND_UNAVAILABLE", "The sign-in service is temporarily unavailable.");
    throw new ApiError(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.");
  }
  if (!data.user) throw new ApiError(401, "AUTH_REQUIRED", "Please sign in to continue.");
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const budget = await db.rpc("consume_api_write_budget");
    if (budget.error) databaseError(budget.error);
    if (budget.data !== true) throw new ApiError(429, "RATE_LIMITED", "Too many changes. Please wait a minute and try again.");
  }
  return { db, user: data.user };
}

export async function requireRole(ctx: Context, adminOnly = false) {
  const { data, error } = await ctx.db.from("profiles").select("role").eq("id", ctx.user!.id).maybeSingle();
  if (error) databaseError(error);
  const allowed = adminOnly ? data?.role === "admin" : ["driver", "verified_driver", "admin"].includes(data?.role);
  if (!allowed) throw new ApiError(403, "FORBIDDEN", adminOnly ? "Administrator access is required." : "Approved driver access is required.");
  if (data?.role === "admin") {
    const { data: verified, error: mfaError } = await ctx.db.rpc("is_marketplace_admin");
    if (mfaError) databaseError(mfaError);
    if (verified !== true) throw new ApiError(403, "MFA_REQUIRED", "Verify your authenticator in account security to continue.");
  }
}
