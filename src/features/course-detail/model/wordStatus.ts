import type { WordProgress } from "../../home";

/** Two or more mistakes after a word was learned mark it as difficult. */
export const DIFFICULT_LAPSES = 2;

export interface WordStatus {
  /** "new": never answered, ready to learn. "review": answered at least once. */
  kind: "new" | "review";
  /** For a word in review: its due time has come. */
  due: boolean;
  dueAt: string | null;
  difficult: boolean;
  ignored: boolean;
  longTerm: boolean;
}

export function wordStatus(card: WordProgress | undefined, now: number): WordStatus {
  const answered = card !== undefined && card.dueAt !== "";
  return {
    kind: answered ? "review" : "new",
    due: answered && new Date(card.dueAt).getTime() <= now,
    dueAt: answered ? card.dueAt : null,
    difficult: answered && card.lapses >= DIFFICULT_LAPSES,
    ignored: card?.ignored === true,
    longTerm: card?.longTerm === true,
  };
}
