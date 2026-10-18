import { AiError } from "./errors";
import { shrinkImage } from "./image";

const BASE = "https://gen.pollinations.ai/image/";

const STYLE_AND_NO_TEXT =
  "Simple friendly flat illustration, bright colours, square composition. The image contains no text of any kind: no words, letters, numbers, captions, signs, labels, logos or speech bubbles.";

/** The picture prompt. The learner's sentence is never quoted in it. */
export function buildImagePrompt(scene: string): string {
  return `${scene.trim()} ${STYLE_AND_NO_TEXT}`;
}

/** Used when no scene description could be prepared. Quote characters are removed. */
export function buildFallbackScene(sentence: string): string {
  return `Illustrate a scene in which ${sentence.replace(/["“”„«»'‘’`]/g, "").trim().replace(/[.!?…]+$/, "")}.`;
}

/**
 * Creates a picture with Pollinations. The key only travels in the Authorization header,
 * never in the address. An empty model means Pollinations' default.
 */
export async function generateWordImage(
  prompt: string,
  key: string,
  model: string,
  signal: AbortSignal,
): Promise<Blob> {
  const query = new URLSearchParams({ width: "768", height: "768" });
  if (model.trim() !== "") query.set("model", model.trim());
  const url = `${BASE}${encodeURIComponent(prompt)}?${query.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (signal.reason === "timeout") throw new AiError("timeout");
      throw error;
    }
    throw new AiError("network");
  }

  if (response.status === 401 || response.status === 403) throw new AiError("image-key");
  if (response.status === 402) throw new AiError("image-credit");
  if (response.status === 429) throw new AiError("limit");
  if (!response.ok) throw new AiError("image");
  if (!(response.headers.get("content-type") ?? "").startsWith("image/")) {
    throw new AiError("image");
  }

  let blob: Blob;
  try {
    blob = await response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (signal.reason === "timeout") throw new AiError("timeout");
      throw error;
    }
    throw new AiError("image");
  }
  if (blob.size === 0) throw new AiError("image");
  return shrinkImage(blob);
}
