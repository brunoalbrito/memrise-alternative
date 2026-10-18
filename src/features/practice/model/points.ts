export const FULL_POINTS = 10;
export const HINT_PENALTY = 3;

export type WordResult = "correct" | "hinted" | "wrong" | "gave_up" | "timeout";

/** Points for one word: full for a clean answer, fewer with each hint (at least 1), none when the learner gave up. */
export function wordPoints(result: WordResult, hintsUsed: number): number {
  if (result === "gave_up" || result === "timeout") return 0;
  return Math.max(1, FULL_POINTS - HINT_PENALTY * hintsUsed);
}

/** How a word ended: hints and mistakes show in the result, and giving up or running out of time override it. */
export function resultOf(ending: "answered" | "gave_up" | "timeout", hintsUsed: number, attempts: number): WordResult {
  if (ending !== "answered") return ending;
  if (attempts > 0) return "wrong";
  return hintsUsed > 0 ? "hinted" : "correct";
}
