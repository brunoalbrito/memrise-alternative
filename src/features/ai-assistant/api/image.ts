import { AiError } from "./errors";

const MAX_SIDE = 768;
const SOFT_LIMIT = 1572864; // 1.5 MB
const HARD_LIMIT = 2097152; // 2 MB

export function imageBlobFromBase64(base64: string, mimeType?: string): Blob {
  let bytes: Uint8Array;
  try {
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  } catch {
    throw new AiError("image");
  }
  if (bytes.length === 0) throw new AiError("image");
  return new Blob([bytes as BlobPart], { type: mimeType || "image/jpeg" });
}

async function toJpeg(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type: "image/jpeg", quality });
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("export failed"))),
      "image/jpeg",
      quality,
    );
  });
}

/** Scales a picture down (longest side 768 px) and saves it as JPEG so it stays small. */
export async function shrinkImage(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas: HTMLCanvasElement | OffscreenCanvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement("canvas"), { width, height });
    const context = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!context) throw new Error("no canvas");
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    let result = await toJpeg(canvas, 0.85);
    if (result.size > SOFT_LIMIT) result = await toJpeg(canvas, 0.7);
    return result;
  } catch {
    if (blob.size <= HARD_LIMIT) return blob;
    throw new AiError("image");
  }
}
