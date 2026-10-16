const base = process.env.APP_URL;
if (!base || !base.startsWith("https://")) throw new Error("Set APP_URL to the public HTTPS production origin.");
for (const path of ["/api/live", "/api/health"]) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error(`Health check failed (${response.status}) for ${path}`);
  const result = await response.json();
  if (result.data?.status !== "ok") throw new Error(`Invalid health response for ${path}`);
  console.log(JSON.stringify({ event: "health_passed", path }));
}
