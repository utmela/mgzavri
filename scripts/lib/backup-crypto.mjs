import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const header = Buffer.from("MGZAVRI-BACKUP-1\n");
export function backupKey(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/i.test(value)) throw new Error("BACKUP_ENCRYPTION_KEY must be a 32-byte hexadecimal encryption key.");
  return Buffer.from(value, "hex");
}
export function encryptBackup(data, key) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([header, iv, cipher.getAuthTag(), encrypted]);
}
export function decryptBackup(data, key) {
  if (!data.subarray(0, header.length).equals(header)) throw new Error("Invalid encrypted backup header.");
  const iv = data.subarray(header.length, header.length + 12);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(data.subarray(header.length + 12, header.length + 28));
  return Buffer.concat([decipher.update(data.subarray(header.length + 28)), decipher.final()]);
}
