import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { number, readBody, text, uuid } from "@/lib/server/validation";

export async function POST(request: Request) {
  return endpoint(async () => {
    const { db } = await context(request);
    const input = await readBody(request);
    const { data, error } = await db.rpc("reserve_trip_booking", {
      p_request_id: uuid(request.headers.get("Idempotency-Key")), p_source: "external",
      p_booking_type: "seat", p_passenger_phone: null,
      p_ride_id: uuid(input.rideId), p_seats: number(input.seats, "passengers", 1, 30, true),
      p_passenger_name: input.passengerName == null || input.passengerName === "" ? null : text(input.passengerName, "passenger name"),
    });
    if (error) databaseError(error);
    return data;
  }, 201, request);
}
