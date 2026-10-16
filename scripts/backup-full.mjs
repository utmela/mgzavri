import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, createCipheriv, createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import path from "node:path";

// Uses pg_dump's custom archive format, encrypted as a stream. No plaintext
// database dump or connection password is written to disk or command arguments.
const secret = process.env.BACKUP_ENCRYPTION_KEY;
if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Set a 32-byte hexadecimal BACKUP_ENCRYPTION_KEY in the secret store.");
if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL in the secret store. Do not paste it into chat or source files.");
const connection = new URL(process.env.DATABASE_URL);
if (!['postgres:', 'postgresql:'].includes(connection.protocol)) throw new Error("DATABASE_URL must be PostgreSQL.");
const directory = path.resolve(process.env.BACKUP_DIRECTORY || "backups");
await mkdir(directory, { recursive: true, mode: 0o700 });
const target = path.join(directory, `database-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(4).toString("hex")}.pgdump.enc`);
const env = { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || "5432", PGDATABASE: decodeURIComponent(connection.pathname.slice(1)), PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password), PGSSLMODE: "verify-full" };
// PostgreSQL 17 supports system CA validation; never silently disable TLS.
env.PGSSLROOTCERT = process.env.PGSSLROOTCERT || "system";
const useDocker = process.env.PG_DUMP_VIA_DOCKER === "true";
const args = ["--format=custom", "--no-owner", "--no-privileges"];
const child = useDocker
  ? spawn("docker", ["run", "--rm", ...["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGSSLMODE", "PGSSLROOTCERT"].flatMap((name) => ["-e", name]), "postgres:17-bookworm", "pg_dump", ...args], { env, stdio: ["ignore", "pipe", "pipe"] })
  : spawn(process.env.PG_DUMP_PATH || "pg_dump", args, { env, stdio: ["ignore", "pipe", "pipe"] });
const exit = new Promise((resolve, reject) => { child.once("error", reject); child.once("close", (code) => code === 0 ? resolve() : reject(new Error("pg_dump failed. Check database connectivity, TLS, credentials and client version."))); });
// Drain diagnostics without logging secrets or database object details.
child.stderr.resume();
const nonce = randomBytes(12), cipher = createCipheriv("aes-256-gcm", Buffer.from(secret, "hex"), nonce);
const digest = createHash("sha256");
const hash = new Transform({ transform(chunk, _encoding, callback) { digest.update(chunk); callback(null, chunk); } });
const output = createWriteStream(target, { flags: "wx", mode: 0o600 });
output.write(Buffer.concat([Buffer.from("MGZAVRI-PGDUMP-1\n"), nonce]));
try {
  await Promise.all([pipeline(child.stdout, cipher, hash, output), exit]);
  // Authentication tag is separate metadata and must accompany the encrypted file.
  const manifest = { format: "mgzavri-pgdump-aes256gcm-v1", file: path.basename(target), createdAt: new Date().toISOString(), ciphertextSha256: digest.digest("hex"), tag: cipher.getAuthTag().toString("hex") };
  await writeFile(`${target}.json`, JSON.stringify(manifest, null, 2), { flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ status: "encrypted_backup_created", file: path.basename(target) }));
} catch (error) {
  child.kill();
  // A failed partial file deliberately has no manifest and is never restorable.
  throw error;
}
