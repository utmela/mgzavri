import { errorResponse } from "./errors.ts";

export async function endpoint(work: () => Promise<unknown>, status = 200, request?: Request) {
  const requestId = crypto.randomUUID();
  const started = performance.now();
  let response: Response;
  try {
    response = Response.json({ data: await work() }, { status, headers: { "Cache-Control": "no-store" } });
  } catch (error) { response = errorResponse(error); }
  response.headers.set("X-Request-ID", requestId);
  // No tokens, payloads, query strings, IDs in paths, or database error text.
  console.info(JSON.stringify({ event: "api_request", requestId, method: request?.method,
    status: response.status, durationMs: Math.round(performance.now() - started) }));
  return response;
}
