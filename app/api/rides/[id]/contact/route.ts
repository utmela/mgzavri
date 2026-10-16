import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { uuid } from "@/lib/server/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const { db } = await context(request);
    const { data, error } = await db.rpc("get_driver_phone", { p_ride_id: uuid((await params).id) });
    if (error) databaseError(error);
    return data;
  }, 200, request);
}
