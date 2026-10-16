import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { invalid, readBody, uuid } from "@/lib/server/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const { db } = await context(request);
    const input = await readBody(request);
    if (input.delta !== -1 && input.delta !== 1) return invalid("Adjust seats one at a time.");
    const { data, error } = await db.rpc("adjust_ride_availability", { p_ride_id: uuid((await params).id), p_delta: input.delta });
    if (error) databaseError(error);
    return data;
  }, 200, request);
}
