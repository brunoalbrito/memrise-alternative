import type { Word } from "../../home";
import type { WordStatus } from "./wordStatus";

export interface LevelStats {
  total: number;
  ignored: number;
  learned: number;
  /** Words ready to review now (ignored and long-term words are left out). */
  due: number;
  /** Words never practiced (ignored words are left out). */
  fresh: number;
}

export interface StatusRow {
  word: Word;
  status: WordStatus;
}

export function levelStats(rows: StatusRow[]): LevelStats {
  let ignored = 0;
  let learned = 0;
  let due = 0;
  let fresh = 0;
  for (const { word, status } of rows) {
    if (word.learned) learned += 1;
    if (status.ignored) {
      ignored += 1;
      continue;
    }
    if (status.kind === "new") fresh += 1;
    else if (status.due && !status.longTerm) due += 1;
  }
  return { total: rows.length, ignored, learned, due, fresh };
}

export type MainAction = { kind: "review"; count: number } | { kind: "learn"; count: number } | { kind: "none" };

/** Review what is due first, then learn new words, otherwise there is nothing to do. */
export function mainAction(stats: LevelStats): MainAction {
  if (stats.due > 0) return { kind: "review", count: stats.due };
  if (stats.fresh > 0) return { kind: "learn", count: stats.fresh };
  return { kind: "none" };
}

export function mainActionLabel(action: MainAction): string {
  if (action.kind === "review") return `Review ${action.count} ${action.count === 1 ? "word" : "words"}`;
  if (action.kind === "learn") return `Learn ${action.count} new ${action.count === 1 ? "word" : "words"}`;
  return "Nothing to practice";
}
