import { AiError } from "./errors";
import { shrinkImage } from "./image";

const BASE = "https://gen.pollinations.ai/image/";

export function buildImagePrompt(word: string, sentence: string): string {
  return [
    `Draw a simple, friendly, colourful illustration of the scene described by this sentence: ${JSON.stringify(sentence)}.`,
    `Show what the sentence says: the people, objects, action and setting it mentions, so that the meaning of the word ${JSON.stringify(word)} is clearly visible in the scene.`,
    "If the sentence is abstract, show a simple everyday scene that conveys it.",
    "Square composition, flat illustration style. Do not include any text, letters, numbers, captions, speech bubbles or watermarks.",
  ].join("\n");
}

/**
 * Creates a picture with Pollinations. The key only travels in the Authorization header,
 * never in the address. An empty model means Pollinations' default.
 */
export async function generateWordImage(
  word: string,
  sentence: string,
  key: string,
  model: string,
  signal: AbortSignal,
): Promise<Blob> {
  const query = new URLSearchParams({ width: "768", height: "768" });
  if (model.trim() !== "") query.set("model", model.trim());
  const url = `${BASE}${encodeURIComponent(buildImagePrompt(word, sentence))}?${query.toString()}`;

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
