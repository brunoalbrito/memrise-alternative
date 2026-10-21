import { safeStorage } from "electron";

/**
 * Encrypt an API key using Electron's native OS storage (Keychain/DPAPI/libsecret).
 */
export function encryptKey(plaintext: string): string {
  try {
    const encrypted = safeStorage.encryptString(plaintext);
    return encrypted.toString("base64");
  } catch (err) {
    throw new Error(`Failed to encrypt API key: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
}

/**
 * Decrypt an API key from Electron's native OS storage.
 */
export function decryptKey(encrypted: string): string {
  try {
    const buffer = Buffer.from(encrypted, "base64");
    return safeStorage.decryptString(buffer);
  } catch (err) {
    throw new Error(`Failed to decrypt API key: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
}

/**
 * Extract last 4 characters of API key for masking.
 */
export function getKeyLast4(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(-4);
}
