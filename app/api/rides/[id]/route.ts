import { PUBLIC_RIDE_COLUMNS } from "@/lib/ride-columns";
import { context, requireRole } from "@/lib/server/context";
import { ApiError, databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { readBody, tripDetails, uuid } from "@/lib/server/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  return endpoint(async () => {
    const id = uuid((await params).id);
    const managing = new URL(request.url).searchParams.get("manage") === "true";
    const ctx = await context(request, managing);
    const { db } = ctx;
    const { data, error } = await db.from("rides").select(PUBLIC_RIDE_COLUMNS).eq("id", id).maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(404, "RIDE_NOT_FOUND", "This trip could not be found.");
    if (managing && data.user_id !== ctx.user!.id) await requireRole(ctx, true);
    return data;
  }, 200, request);
}

export async function PATCH(request: Request, { params }: Params) {
  return endpoint(async () => {
    const { db } = await context(request);
    const id = uuid((await params).id);
    const details = tripDetails(await readBody(request));
    const { error } = await db.rpc("update_trip_details", {
      p_ride_id: id, p_vehicle_type: details.vehicle_type, p_departure_time: details.departure_time,
      p_seats_total: details.seats_total, p_price_per_seat: details.price_per_seat,
      p_pickup_point: details.pickup_point, p_dropoff_point: details.dropoff_point,
      p_allow_entire_van_booking: details.allow_entire_van_booking, p_entire_van_price: details.entire_van_price,
    });
    if (error) databaseError(error);
    return { id };
  }, 200, request);
}

export async function DELETE(request: Request, { params }: Params) {
  return endpoint(async () => {
    const { db } = await context(request);
    const id = uuid((await params).id);
    const { data, error } = await db.from("rides").delete().eq("id", id).select("id").maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(404, "RIDE_NOT_FOUND", "This trip is unavailable or you cannot delete it.");
    return { id };
  }, 200, request);
}
