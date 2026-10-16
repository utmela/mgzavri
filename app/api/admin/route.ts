import { PUBLIC_RIDE_COLUMNS } from "@/lib/ride-columns";
import { context, requireRole } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { pagination } from "@/lib/server/validation";

export async function GET(request: Request) {
  return endpoint(async () => {
    const ctx = await context(request);
    await requireRole(ctx, true);
    const { limit, offset } = pagination(new URL(request.url).searchParams);
    const results = await Promise.all([
      ctx.db.from("rides").select(PUBLIC_RIDE_COLUMNS).order("created_at", { ascending: false }).range(offset, offset + limit - 1),
      ctx.db.from("requests").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1),
      ctx.db.from("bookings").select("*").order("created_at", { ascending: false }).range(offset, offset + limit - 1),
    ]);
    for (const result of results) if (result.error) databaseError(result.error);
    return { rides: results[0].data, requests: results[1].data, bookings: results[2].data };
  }, 200, request);
}
