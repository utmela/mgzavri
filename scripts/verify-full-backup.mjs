import { readFile } from "node:fs/promises";
import { createDecipheriv, createHash } from "node:crypto";

// Verifies integrity/decryptability without writing a plaintext dump. A separate
// restore into a disposable staging project is still required for disaster recovery.
const filename = process.env.BACKUP_FILE;
const key = process.env.BACKUP_ENCRYPTION_KEY;
if (!filename || !key || !/^[a-f0-9]{64}$/i.test(key)) throw new Error("Set BACKUP_FILE and the 32-byte BACKUP_ENCRYPTION_KEY.");
const header = Buffer.from("MGZAVRI-PGDUMP-1\n");
const data = await readFile(filename);
const manifest = JSON.parse(await readFile(`${filename}.json`, "utf8"));
if (manifest.format !== "mgzavri-pgdump-aes256gcm-v1" || !data.subarray(0, header.length).equals(header)) throw new Error("Invalid backup format.");
const ciphertext = data.subarray(header.length + 12);
if (createHash("sha256").update(ciphertext).digest("hex") !== manifest.ciphertextSha256) throw new Error("Backup checksum mismatch.");
const decipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), data.subarray(header.length, header.length + 12));
decipher.setAuthTag(Buffer.from(manifest.tag, "hex"));
const prefix = decipher.update(ciphertext);
decipher.final();
if (prefix.subarray(0, 5).toString("ascii") !== "PGDMP") throw new Error("Decrypted data is not a PostgreSQL custom archive.");
console.log(JSON.stringify({ status: "backup_integrity_verified", createdAt: manifest.createdAt }));
