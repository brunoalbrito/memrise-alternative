import { AiError } from "../api/errors";

export interface WordText {
  definition: string;
  sentences: string[];
  best: number;
  ipa: string;
}

export interface WordSuggestion extends WordText {
  word: string;
  audio: Blob | null;
}

function unwrapFence(raw: string): string {
  const match = raw.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1] : raw.trim();
}

export function stripSlashes(ipa: string): string {
  return ipa.trim().replace(/^\/+|\/+$/g, "").trim();
}

/** Parses and validates the model's JSON text. Throws AiError("unusable") when it cannot be used. */
export function parseWordText(raw: string): WordText {
  let data: unknown;
  try {
    data = JSON.parse(unwrapFence(raw));
  } catch {
    throw new AiError("unusable");
  }
  if (typeof data !== "object" || data === null) throw new AiError("unusable");
  const record = data as Record<string, unknown>;

  const definition =
    typeof record.definition === "string" ? record.definition.trim() : "";
  const sentences = Array.isArray(record.sentences)
    ? record.sentences
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item !== "")
        .slice(0, 3)
    : [];
  const ipa = typeof record.ipa === "string" ? stripSlashes(record.ipa) : "";
  if (definition === "" || sentences.length === 0 || ipa === "") {
    throw new AiError("unusable");
  }

  const best =
    typeof record.best === "number" && Number.isInteger(record.best)
      ? Math.min(Math.max(record.best, 0), sentences.length - 1)
      : 0;
  return { definition, sentences, best, ipa };
}
