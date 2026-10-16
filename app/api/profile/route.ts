import { context } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";

export async function GET(request: Request) {
  return endpoint(async () => {
    const { db, user } = await context(request);
    const { data, error } = await db.from("profiles").select("id,name,phone,role").eq("id", user!.id).maybeSingle();
    if (error) databaseError(error);
    return data;
  }, 200, request);
}
