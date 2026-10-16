import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";

export async function GET(request: Request) {
  return endpoint(async () => {
    // A real, read-only dependency probe. Never report success on config alone.
    const { db } = await context(request, false);
    const { error } = await db.from("rides").select("id").limit(1);
    if (error) databaseError(error);
    return { status: "ok" };
  }, 200, request);
}
