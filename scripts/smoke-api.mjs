import assert from "node:assert/strict";

// Read-only checks against a running app. Does not create accounts or bookings.
const base = process.env.APP_URL || "http://127.0.0.1:3000";
if (!/^https?:\/\//.test(base)) throw new Error("APP_URL must be an HTTP URL.");
const checks = [
  ["/api/live", 200],
  ["/api/health", 200],
  ["/api/rides", 200],
  ["/api/rides?from=Tbilisi&to=Batumi", 200],
  ["/api/rides?date=2026-02-30", 400],
  ["/api/rides?from=Unsupported", 400],
  ["/api/rides?limit=1000", 400],
  ["/api/rides/invalid-id", 400],
  ["/api/rides?scope=mine", 401],
  ["/api/profile", 401],
  ["/api/bookings", 401],
  ["/api/requests", 401],
  ["/api/admin", 401],
  ["/api/admin/audit", 401],
];
for (const [path, expected] of checks) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  const body = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(body)}`);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  if (expected >= 400) assert.equal(typeof body.error?.code, "string");
  if (path === "/api/rides") {
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.every((ride) => !("phone" in ride)));
  }
  console.log(`PASS ${expected} ${path}`);
}
const unauthorizedWrite = await fetch(new URL("/api/bookings", base), {
  method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
});
assert.equal(unauthorizedWrite.status, 401);
console.log("PASS anonymous booking write rejected");
const crossOriginWrite = await fetch(new URL("/api/bookings", base), {
  method: "POST", headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" }, body: "{}",
});
assert.equal(crossOriginWrite.status, 403);
console.log("PASS cross-origin mutation rejected before authentication");
const documents = await Promise.all([fetch(base), fetch(base)]);
const nonces = [];
for (const response of documents) {
  assert.equal(response.status, 200);
  const policy = response.headers.get("Content-Security-Policy") || "";
  const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce, "HTML must have a nonce-based CSP");
  assert.equal(policy.includes("'unsafe-eval'"), false, "Production scripts must not allow eval");
  const html = await response.text();
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)];
  assert.ok(scripts.length > 0);
  assert.ok(scripts.every((match) => match[1].includes(`nonce="${nonce}"`)), "SSR scripts must carry this response's nonce");
  nonces.push(nonce);
}
assert.notEqual(nonces[0], nonces[1], "A nonce must not be shared between HTML responses");
console.log("PASS production CSP uses fresh nonces on executable scripts");
console.log(`${checks.length + 3} live API/security checks passed.`);
