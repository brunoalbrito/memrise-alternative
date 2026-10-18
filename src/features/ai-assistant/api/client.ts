import type { Result } from "../../../shared/api";
import { getApi } from "../../../shared/api";
import { AiError, type AiErrorKind } from "./errors";
import type { WordText } from "../model/suggestion";

/**
 * Calls to the AI service. They run in the app's main process, which holds the keys:
 * the screens never see a key and never talk to Google or Pollinations themselves.
 */

function kindOf(code: string): AiErrorKind | null {
  return code.startsWith("ai:") ? (code.slice(3) as AiErrorKind) : null;
}

function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.data;
  const kind = kindOf(result.error.code);
  if (kind) throw new AiError(kind);
  throw new Error(result.error.message);
}

/** Rejects as soon as the signal is aborted (timeout or cancel); the main process finishes on its own. */
function abortable<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const onAbort = () =>
      reject(signal.reason === "timeout" ? new AiError("timeout") : new DOMException("Aborted", "AbortError"));
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, (error: unknown) => reject(error)).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

export function generateWordText(word: string, languageName: string, signal: AbortSignal): Promise<WordText> {
  return abortable(getApi().ai.wordText(word, languageName).then(unwrap), signal);
}

export function generateWordAudio(word: string, signal: AbortSignal): Promise<Blob> {
  return abortable(
    getApi()
      .ai.wordAudio(word)
      .then(unwrap)
      .then((bytes) => new Blob([bytes as BlobPart], { type: "audio/wav" })),
    signal,
  );
}

/** Describes the scene of the sentence and draws it. Returns a JPEG. */
export function generateWordImage(word: string, sentence: string, signal: AbortSignal): Promise<Blob> {
  return abortable(
    getApi()
      .ai.wordImage(word, sentence)
      .then(unwrap)
      .then((bytes) => new Blob([bytes as BlobPart], { type: "image/jpeg" })),
    signal,
  );
}

export async function testConnection(): Promise<void> {
  unwrap(await getApi().ai.testGoogle());
}
