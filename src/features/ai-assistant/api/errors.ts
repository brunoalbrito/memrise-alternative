export type AiErrorKind =
  | "invalid-key"
  | "limit"
  | "network"
  | "timeout"
  | "refused"
  | "unusable"
  | "service"
  | "audio"
  | "image";

/** Never put the API key or raw response bodies in the message. */
export class AiError extends Error {
  readonly kind: AiErrorKind;

  constructor(kind: AiErrorKind) {
    super(aiMessage(kind));
    this.name = "AiError";
    this.kind = kind;
  }
}

export function aiMessage(kind: AiErrorKind): string {
  switch (kind) {
    case "invalid-key":
      return "Google did not accept your API key. Check it in AI settings.";
    case "limit":
      return "The usage limit was reached. Try again later.";
    case "network":
      return "Could not reach the AI service. Check your connection and try again.";
    case "timeout":
      return "The AI service took too long. Try again.";
    case "refused":
      return "The AI service could not prepare suggestions for this word.";
    case "unusable":
      return "Suggestions could not be prepared. Try again.";
    case "service":
      return "The AI service had a problem. Try again later.";
    case "audio":
      return "Audio could not be created.";
    case "image":
      return "Image could not be created.";
  }
}
