import { context, requireRole } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";

export async function GET(request: Request) {
  return endpoint(async () => {
    const ctx = await context(request);
    await requireRole(ctx, true);
    const { data, error } = await ctx.db.rpc("get_admin_audit", { p_limit: 100 });
    if (error) databaseError(error);
    return data;
  }, 200, request);
}
