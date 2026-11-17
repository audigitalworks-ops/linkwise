import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128-bit IV

function getKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    // Development fallback key (32 bytes = 64 hex characters)
    return Buffer.from("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", "hex");
  }
  return Buffer.from(hexKey, "hex");
}

/**
 * Encrypts a plaintext string (e.g. WordPress application password) using AES-256-GCM.
 * Returns a colon-delimited string: `ciphertext:iv:authTag` (all hex encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${encrypted}:${iv.toString("hex")}:${authTag}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string (`ciphertext:iv:authTag`).
 */
export function decrypt(encryptedPayload: string): string {
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format.");
  }

  const [ciphertext, ivHex, authTagHex] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

