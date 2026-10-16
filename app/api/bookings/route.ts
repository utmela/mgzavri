import { PUBLIC_RIDE_COLUMNS } from "@/lib/ride-columns";
import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { newBooking, pagination, readBody, uuid } from "@/lib/server/validation";

export async function GET(request: Request) {
  return endpoint(async () => {
    const { db, user } = await context(request);
    const { limit, offset } = pagination(new URL(request.url).searchParams);
    const { data, error } = await db.from("bookings").select(`*,ride:rides(${PUBLIC_RIDE_COLUMNS})`)
      .eq("user_id", user!.id).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) databaseError(error);
    return data;
  }, 200, request);
}

export async function POST(request: Request) {
  return endpoint(async () => {
    const { db } = await context(request);
    // Prices, ownership and inventory are calculated in one locked transaction.
    const { data, error } = await db.rpc("reserve_trip_booking", {
      ...newBooking(await readBody(request)),
      p_request_id: uuid(request.headers.get("Idempotency-Key")), p_source: "platform",
    });
    if (error) databaseError(error);
    return data;
  }, 201, request);
}
