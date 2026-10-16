import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { uuid } from "@/lib/server/validation";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const { db } = await context(request);
    const id = uuid((await params).id);
    const { error } = await db.rpc("cancel_trip_booking", { p_booking_id: id });
    if (error) databaseError(error);
    return { id };
  }, 200, request);
}
