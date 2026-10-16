import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { encryptBackup, decryptBackup } from "./lib/backup-crypto.mjs";
import { restoreSnapshot } from "./lib/restore-snapshot.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const testRoot = path.resolve(root, ".test-data");
const databaseDir = path.resolve(testRoot, randomUUID());
if (!databaseDir.startsWith(testRoot + path.sep)) throw new Error("Unsafe test database directory.");
await mkdir(testRoot, { recursive: true });
const probe = net.createServer();
await new Promise((resolve, reject) => { probe.once("error", reject); probe.listen(0, "127.0.0.1", resolve); });
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const password = randomBytes(32).toString("hex");
const cluster = new EmbeddedPostgres({ databaseDir, port, user: "postgres", password,
  persistent: true, createPostgresUser: false, authMethod: "scram-sha-256",
  postgresFlags: ["-h", "127.0.0.1"], initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: () => {}, onError: () => {},
});
const clients = [];
async function connection(actor, database = "mgzavri_test") {
  const client = new pg.Client({ host: "127.0.0.1", port, user: "postgres", password, database, connectionTimeoutMillis: 10000 });
  await client.connect(); clients.push(client);
  if (actor) {
    await client.query("set role authenticated");
    await client.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims','{\"aal\":\"aal1\"}',false)", [actor]);
  }
  return client;
}
let started = false;
try {
  await cluster.initialise(); await cluster.start(); started = true;
  await cluster.createDatabase("mgzavri_test");
  const owner = await connection();
  const files = ["supabase/tests/bootstrap.sql", ...(await readdir(path.join(root, "supabase/migrations"))).filter((name) => name.endsWith(".sql")).sort().map((name) => `supabase/migrations/${name}`), "supabase/tests/security.sql", "supabase/tests/launch.sql"];
  for (const file of files) {
    await owner.query(await readFile(path.join(root, file), "utf8"));
    console.log(`PASS ${file}`);
  }
  const [driver, passenger, other] = [randomUUID(), randomUUID(), randomUUID()];
  await owner.query("insert into auth.users(id) select unnest($1::uuid[])", [[driver, passenger, other]]);
  await owner.query("update public.profiles set role='verified_driver' where id=$1", [driver]);
  async function trip(seats) {
    const result = await owner.query("insert into public.rides(user_id,driver_name,phone,from_city,to_city,departure_time,vehicle_type,seats_total,seats_available,price_per_seat) values($1,'Concurrency test','123','Tbilisi','Batumi',now()+interval '10 days','Van',$2,$2,20) returning id", [driver, seats]);
    return result.rows[0].id;
  }
  const first = await connection(passenger), second = await connection(other), sameUser = await connection(passenger);
  const reserve = (client, requestId, rideId, seats = 1) => client.query("select public.reserve_trip_booking($1,$2,'Test','123',$3,'seat','platform') as id", [requestId, rideId, seats]);
  const lastSeat = await trip(1);
  const competition = await Promise.allSettled([reserve(first, randomUUID(), lastSeat), reserve(second, randomUUID(), lastSeat)]);
  assert.equal(competition.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(competition.filter((result) => result.status === "rejected" && result.reason.message.includes("NOT_ENOUGH_SEATS")).length, 1);
  assert.equal((await owner.query("select seats_available from public.rides where id=$1", [lastSeat])).rows[0].seats_available, 0);
  console.log("PASS two simultaneous clients cannot reserve the last seat twice");

  const retryTrip = await trip(3), retryKey = randomUUID();
  const retry = await Promise.all([reserve(first, retryKey, retryTrip), reserve(sameUser, retryKey, retryTrip)]);
  assert.equal(retry[0].rows[0].id, retry[1].rows[0].id);
  assert.equal((await owner.query("select seats_available from public.rides where id=$1", [retryTrip])).rows[0].seats_available, 2);
  console.log("PASS simultaneous retries return one booking and consume seats once");
  await assert.rejects(reserve(first, retryKey, retryTrip, 2), /IDEMPOTENCY_CONFLICT/);
  console.log("PASS a reused request ID cannot change booking details");
  await Promise.all([first.query("select public.cancel_trip_booking($1)", [retry[0].rows[0].id]), sameUser.query("select public.cancel_trip_booking($1)", [retry[0].rows[0].id])]);
  assert.equal((await owner.query("select seats_available from public.rides where id=$1", [retryTrip])).rows[0].seats_available, 3);
  console.log("PASS simultaneous cancellations restore inventory once");
  await assert.rejects(reserve(first, retryKey, retryTrip), /BOOKING_CANCELLED/);
  console.log("PASS a cancelled idempotent booking cannot be silently recreated");
  let snapshot;
  if (process.env.SNAPSHOT_FILE) {
    const result = spawnSync("pwsh", ["-NoProfile", "-File", path.join(root, "scripts/protect-snapshot.ps1"), "-Action", "Read", "-Path", path.resolve(process.env.SNAPSHOT_FILE)], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) throw new Error("The approved snapshot could not be decrypted by this Windows user.");
    try { snapshot = JSON.parse(result.stdout); } catch { throw new Error("Invalid snapshot data."); }
  } else {
    snapshot = { format: "mgzavri-application-snapshot-v1", tables: {} };
    for (const table of ["auth.users", "public.profiles", "public.rides", "public.bookings", "public.requests"]) snapshot.tables[table] = (await owner.query(`select * from ${table}`)).rows;
  }
  const key = randomBytes(32), encoded = Buffer.from(JSON.stringify(snapshot));
  const encrypted = encryptBackup(encoded, key);
  assert.deepEqual(decryptBackup(encrypted, key), encoded);
  const damaged = Buffer.from(encrypted); damaged[damaged.length - 1] ^= 1;
  assert.throws(() => decryptBackup(damaged, key));
  console.log("PASS encrypted snapshot roundtrip and tamper detection");
  await cluster.createDatabase("mgzavri_restore_test");
  const restore = await connection(null, "mgzavri_restore_test");
  for (const file of files.filter((name) => !name.endsWith("/security.sql") && !name.endsWith("/launch.sql"))) await restore.query(await readFile(path.join(root, file), "utf8"));
  await restoreSnapshot(restore, JSON.parse(decryptBackup(encrypted, key).toString("utf8")));
  console.log(`PASS ${process.env.SNAPSHOT_FILE ? "approved live application snapshot" : "synthetic application snapshot"} restored into an isolated empty database with matching row counts`);
  console.log("Isolated PostgreSQL migration, authorization, quota and concurrency checks passed.");
} finally {
  for (const client of clients) await client.end().catch(() => {});
  if (started) await cluster.stop();
  // Recheck the exact absolute target before recursive cleanup on Windows.
  const cleanup = path.resolve(databaseDir);
  if (cleanup.startsWith(testRoot + path.sep) && path.dirname(cleanup) === testRoot) await rm(cleanup, { recursive: true, force: true });
}
