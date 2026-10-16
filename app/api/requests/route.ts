import { context, requireRole } from "@/lib/server/context";
import { databaseError } from "@/lib/server/errors";
import { endpoint } from "@/lib/server/http";
import { georgiaToday, newRequest, pagination, readBody } from "@/lib/server/validation";

export async function GET(request: Request) {
  return endpoint(async () => {
    const ctx = await context(request);
    const params = new URL(request.url).searchParams;
    const mine = params.get("scope") === "mine";
    if (!mine) await requireRole(ctx);
    const { limit, offset } = pagination(params);
    let query = ctx.db.from("requests").select("*");
    query = mine ? query.eq("user_id", ctx.user!.id) : query.gte("departure_date", georgiaToday());
    const { data, error } = await query.order("departure_date", { ascending: true }).range(offset, offset + limit - 1);
    if (error) databaseError(error);
    return data;
  }, 200, request);
}

export async function POST(request: Request) {
  return endpoint(async () => {
    const { db, user } = await context(request);
    const input = newRequest(await readBody(request));
    const { data, error } = await db.from("requests").insert({ ...input, user_id: user!.id }).select("id").single();
    if (error) databaseError(error);
    return data;
  }, 201, request);
}
