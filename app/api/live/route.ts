export function GET() {
  return Response.json({ data: { status: "ok" } }, { headers: { "Cache-Control": "no-store" } });
}
