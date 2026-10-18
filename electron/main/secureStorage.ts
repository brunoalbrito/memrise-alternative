import { nativeImage, safeStorage } from "electron";
import type { Cipher } from "../services/secrets";

/** Operating-system protected storage: Keychain (macOS), DPAPI (Windows), libsecret/kwallet (Linux). */
export const osCipher: Cipher = {
  available: () => safeStorage.isEncryptionAvailable(),
  weak: () => process.platform === "linux" && safeStorage.getSelectedStorageBackend() === "basic_text",
  encrypt: (plain) => safeStorage.encryptString(plain),
  decrypt: (data) => safeStorage.decryptString(Buffer.from(data)),
};

const MAX_SIDE = 768;
const SOFT_LIMIT = 1_572_864;
const HARD_LIMIT = 2_097_152;

/** Scales a picture down (longest side 768 px) and saves it as JPEG so it stays small. */
export function shrinkImage(bytes: Uint8Array): Uint8Array {
  const image = nativeImage.createFromBuffer(Buffer.from(bytes));
  if (image.isEmpty()) {
    if (bytes.length <= HARD_LIMIT) return bytes;
    throw new Error("image too large");
  }
  const { width, height } = image.getSize();
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const resized =
    scale < 1
      ? image.resize({ width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), quality: "good" })
      : image;
  let jpeg = resized.toJPEG(85);
  if (jpeg.length > SOFT_LIMIT) jpeg = resized.toJPEG(70);
  return new Uint8Array(jpeg);
}
