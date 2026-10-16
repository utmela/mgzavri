import { context } from "@/lib/server/context";
import { ApiError, databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { uuid } from "@/lib/server/validation";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return endpoint(async () => {
    const { db } = await context(request);
    const id = uuid((await params).id);
    const { data, error } = await db.from("requests").delete().eq("id", id).select("id").maybeSingle();
    if (error) databaseError(error);
    if (!data) throw new ApiError(404, "REQUEST_NOT_FOUND", "This request is unavailable or you cannot delete it.");
    return { id };
  }, 200, request);
}
