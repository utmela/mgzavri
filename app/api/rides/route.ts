import { PUBLIC_RIDE_COLUMNS } from "@/lib/ride-columns";
import { context, requireRole } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { city, date, newTrip, pagination, readBody } from "@/lib/server/validation";

export async function GET(request: Request) {
  return endpoint(async () => {
    const params = new URL(request.url).searchParams;
    const mine = params.get("scope") === "mine";
    const { db, user } = await context(request, mine);
    const { limit, offset } = pagination(params);
    let query = db.from("rides").select(mine ? `${PUBLIC_RIDE_COLUMNS},bookings(*)` : PUBLIC_RIDE_COLUMNS);
    if (mine) query = query.eq("user_id", user!.id);
    else {
      query = query.gte("departure_time", new Date().toISOString()).gt("seats_available", 0).eq("full_van_booked", false);
      if (params.get("from")) query = query.eq("from_city", city(params.get("from")));
      if (params.get("to")) query = query.eq("to_city", city(params.get("to")));
      if (params.get("date")) {
        const day = date(params.get("date"));
        // Georgian trips use Asia/Tbilisi, independent of the visitor's timezone.
        query = query.gte("departure_time", `${day}T00:00:00+04:00`).lte("departure_time", `${day}T23:59:59.999+04:00`);
      }
    }
    const { data, error } = await query.order("departure_time", { ascending: true }).range(offset, offset + limit - 1);
    if (error) databaseError(error);
    return data;
  }, 200, request);
}

export async function POST(request: Request) {
  return endpoint(async () => {
    const ctx = await context(request);
    await requireRole(ctx);
    const ride = newTrip(await readBody(request));
    const { data, error } = await ctx.db.from("rides").insert({ ...ride, user_id: ctx.user!.id }).select("id").single();
    if (error) databaseError(error);
    return data;
  }, 201, request);
}
