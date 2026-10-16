import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { context, requireRole } from "../lib/server/context.ts";
import { ApiError, databaseError, errorResponse } from "../lib/server/errors.ts";
import { endpoint } from "../lib/server/http.ts";
import { date, newBooking, newRequest, newTrip, pagination, readBody } from "../lib/server/validation.ts";
import { safeReturnTo } from "../lib/auth-redirect.ts";
import { bookingAttemptKey, getBookingAttempt, clearBookingAttempt } from "../lib/booking-attempt.ts";

const id = "10000000-0000-0000-0000-000000000001";
const originalFetch = globalThis.fetch;
const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const originalPublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const originalSiteUrl = process.env.SITE_URL;
const originalWrites = process.env.MARKETPLACE_WRITES_ENABLED;
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries({ NEXT_PUBLIC_SUPABASE_URL: originalUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: originalKey, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: originalPublishableKey, SITE_URL: originalSiteUrl, MARKETPLACE_WRITES_ENABLED: originalWrites })) {
    if (value === undefined) delete process.env[name]; else process.env[name] = value;
  }
});

test("cross-site writes and the emergency pause stop before database access", async () => {
  globalThis.fetch = async () => { throw new Error("Must not reach the backend"); };
  process.env.SITE_URL = "https://site.test";
  await assert.rejects(context(new Request("https://site.test/api/bookings", { method: "POST", headers: { Origin: "https://attacker.test" } })), (error: unknown) => error instanceof ApiError && error.code === "ORIGIN_REJECTED");
  process.env.MARKETPLACE_WRITES_ENABLED = "false";
  await assert.rejects(context(new Request("https://site.test/api/bookings", { method: "POST" })), (error: unknown) => error instanceof ApiError && error.code === "MAINTENANCE");
});

test("write quota denial persists as a separate RPC and returns retry guidance", async () => {
  fakeBackend();
  globalThis.fetch = async (input) => String(input).includes("/auth/v1/user") ? Response.json({ id, aud: "authenticated", role: "authenticated" }) : Response.json(false);
  await assert.rejects(context(new Request("https://site.test/api/bookings", { method: "POST", headers: { Authorization: "Bearer verified-user" } })), (error: unknown) => error instanceof ApiError && error.status === 429);
  assert.equal(errorResponse(new ApiError(429, "RATE_LIMITED", "Wait")).headers.get("Retry-After"), "60");
});

test("admin tools require the database MFA check even when the profile says admin", async () => {
  fakeBackend();
  let allowed = false;
  globalThis.fetch = async (input) => {
    if (String(input).includes("/auth/v1/user")) return Response.json({ id, aud: "authenticated", role: "authenticated" });
    if (String(input).includes("/rpc/is_marketplace_admin")) return Response.json(allowed);
    return Response.json([{ role: "admin" }]);
  };
  const ctx = await context(new Request("https://site.test", { headers: { Authorization: "Bearer verified-user" } }));
  await assert.rejects(requireRole(ctx, true), (error: unknown) => error instanceof ApiError && error.code === "MFA_REQUIRED");
  allowed = true;
  await requireRole(ctx, true);
});

test("authentication redirects cannot escape the site", () => {
  for (const value of ["https://attacker.test", "//attacker.test", "/\\attacker.test", "/%2fattacker.test", "/auth/complete", "/\nattacker.test"]) assert.equal(safeReturnTo(value), "/");
  assert.equal(safeReturnTo("/my-bookings?tab=upcoming"), "/my-bookings?tab=upcoming");
});

test("booking retry keys are stable and isolated by account, trip and source", () => {
  const key = bookingAttemptKey("first", "trip", "platform");
  const attempt = getBookingAttempt(key);
  assert.equal(getBookingAttempt(key), attempt);
  assert.notEqual(getBookingAttempt(bookingAttemptKey("second", "trip", "platform")), attempt);
  clearBookingAttempt(key);
  assert.notEqual(getBookingAttempt(key), attempt);
});

function fakeBackend() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-only.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-public-key";
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

const trip = {
  from_city: "Tbilisi", to_city: "Batumi", driver_name: "Test Driver", phone: "+995555000000",
  departure_time: "2099-01-01T12:00:00+04:00", vehicle_type: "Van", seats_total: 8,
  price_per_seat: 25, allow_entire_van_booking: false,
};

test("trip validation discards forged ownership, inventory and payment fields", () => {
  const result = newTrip({ ...trip, user_id: "victim", seats_available: 99, full_van_booked: true, role: "admin" });
  assert.equal(result.seats_available, 8);
  assert.equal(result.departure_time, "2099-01-01T08:00:00.000Z");
  assert.equal("user_id" in result, false);
  assert.equal("full_van_booked" in result, false);
  assert.equal("role" in result, false);
});

test("rejects invalid route, prices, capacity, departure and van configuration", () => {
  for (const input of [
    { ...trip, to_city: "Tbilisi" }, { ...trip, from_city: "Unknown" },
    { ...trip, price_per_seat: -1 }, { ...trip, price_per_seat: "25" },
    { ...trip, seats_total: 2.5 }, { ...trip, seats_total: 31 },
    { ...trip, departure_time: "2099-01-01T12:00:00" },
    { ...trip, departure_time: "2000-01-01T00:00:00Z" },
    { ...trip, allow_entire_van_booking: true, entire_van_price: null },
    { ...trip, accessories: ["unknown"] },
  ]) assert.throws(() => newTrip(input), ApiError);
});

test("booking RPC input never trusts client supplied price or user ID", () => {
  const result = newBooking({ rideId: id, passengerName: " Test ", passengerPhone: "123", seats: 2, bookingType: "seat", total_price: 0, user_id: "victim" });
  assert.equal(result.p_passenger_name, "Test");
  assert.deepEqual(Object.keys(result).sort(), ["p_booking_type", "p_passenger_name", "p_passenger_phone", "p_ride_id", "p_seats"]);
  assert.throws(() => newBooking({ rideId: id, seats: 0 }), ApiError);
});

test("request dates and pagination reject malformed or unbounded input", () => {
  assert.throws(() => date("2026-02-30"), ApiError);
  assert.throws(() => newRequest({ from_city: "Tbilisi", to_city: "Batumi", departure_date: "2000-01-01", passengers: 2, phone: "123" }), ApiError);
  assert.throws(() => pagination(new URLSearchParams("limit=10000")), ApiError);
  assert.throws(() => pagination(new URLSearchParams("offset=-1")), ApiError);
  assert.deepEqual(pagination(new URLSearchParams()), { limit: 100, offset: 0 });
});

test("body reader rejects arrays, invalid JSON, wrong content type and oversized streams", async () => {
  for (const body of ["[]", "null", "bad-json", JSON.stringify({ notes: "x".repeat(20000) })]) {
    await assert.rejects(readBody(new Request("https://site.test", { method: "POST", headers: { "Content-Type": "application/json" }, body })), ApiError);
  }
  await assert.rejects(readBody(new Request("https://site.test", { method: "POST", body: "{}" })), ApiError);
  assert.deepEqual(await readBody(new Request("https://site.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"seats":2}' })), { seats: 2 });
});

test("unauthenticated protected requests stop before contacting the database", async () => {
  globalThis.fetch = async () => { throw new Error("Must not fetch"); };
  await assert.rejects(context(new Request("https://site.test")), (error: unknown) => error instanceof ApiError && error.status === 401);
  await assert.rejects(context(new Request("https://site.test", { headers: { Authorization: "Basic invalid" } })), ApiError);
});

test("verified tokens are scoped to each request and passenger cannot access driver/admin data", async () => {
  fakeBackend();
  const seen: string[] = [];
  globalThis.fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    seen.push(headers.get("authorization") || "");
    if (String(input).includes("/auth/v1/user")) return Response.json({ id, aud: "authenticated", role: "authenticated" });
    return Response.json([{ role: "passenger" }]);
  };
  const ctx = await context(new Request("https://site.test", { headers: { Authorization: "Bearer test-user-jwt" } }));
  assert.equal(ctx.user?.id, id);
  await assert.rejects(requireRole(ctx), (error: unknown) => error instanceof ApiError && error.status === 403);
  await assert.rejects(requireRole(ctx, true), ApiError);
  assert.ok(seen.length >= 3);
  assert.ok(seen.every((value) => value === "Bearer test-user-jwt"));
  const anonymous = await context(new Request("https://site.test"), false);
  assert.equal(anonymous.user, null);
});

test("an invalid session is rejected even if a bearer header exists", async () => {
  fakeBackend();
  globalThis.fetch = async () => Response.json({ msg: "invalid JWT", code: "bad_jwt" }, { status: 401 });
  await assert.rejects(context(new Request("https://site.test", { headers: { Authorization: "Bearer forged" } })), (error: unknown) => error instanceof ApiError && error.status === 401);
});

test("database failures return stable status codes and redact internal details", async () => {
  assert.throws(() => databaseError({ message: "NOT_ENOUGH_SEATS" }), (error: unknown) => error instanceof ApiError && error.status === 409);
  assert.throws(() => databaseError({ message: "TRIP_HAS_BOOKINGS" }), (error: unknown) => error instanceof ApiError && error.status === 409);
  const response = await endpoint(async () => databaseError({ message: "secret SQL and passenger phone" }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await response.text()).includes("secret SQL"), false);
  assert.equal(errorResponse(new Error("secret")).status, 500);
});
