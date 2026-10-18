import type { CourseLevel } from "./types";

/** What the app knows about a practiced word (see `study.progress` in the desktop API). */
export interface WordProgress {
  learned: boolean;
  /** Empty until the word has been answered. */
  dueAt: string;
  ignored: boolean;
  longTerm: boolean;
}

export type ProgressCards = Record<string, WordProgress>;

/** Levels whose `learned` flags come from the learner's real progress instead of the stored or sample flags. */
export function overlayLearned(levels: CourseLevel[], cards: ProgressCards): CourseLevel[] {
  return levels.map((level) => ({
    ...level,
    words: level.words.map((word) => {
      const learned = cards[word.id]?.learned === true;
      return word.learned === learned ? word : { ...word, learned };
    }),
  }));
}

const isDue = (card: WordProgress | undefined, now: number): boolean =>
  card !== undefined && card.dueAt !== "" && !card.ignored && !card.longTerm && new Date(card.dueAt).getTime() <= now;

export interface CourseProgressCounts {
  due: number;
  ignored: number;
  longTerm: number;
}

/** Due, ignored and long-term word counts for the words of a course. */
export function progressCounts(levels: CourseLevel[], cards: ProgressCards, now: number): CourseProgressCounts {
  let due = 0;
  let ignored = 0;
  let longTerm = 0;
  for (const word of levels.flatMap((level) => level.words)) {
    if (word.text.trim() === "") continue;
    const card = cards[word.id];
    if (!card) continue;
    if (card.ignored) ignored += 1;
    if (card.longTerm) longTerm += 1;
    if (isDue(card, now)) due += 1;
  }
  return { due, ignored, longTerm };
}
