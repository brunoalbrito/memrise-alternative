import type { Word } from "../../home";
import { wordHasText } from "../../home";

export const SESSION_SIZE = 10;

export interface PracticeQueue {
  words: Word[];
  /** Words left out because they have no image, meaning or example to prompt the learner. */
  skipped: number;
}

/** A word can be practiced when it has text and something to prompt with. */
export const hasPrompt = (word: Word): boolean =>
  word.images.length > 0 || word.meaning.trim() !== "" || word.example.trim() !== "";

/** The words of one session, in level order. Scheduling (spec 022) replaces this ordering with due and new words. */
export function buildQueue(levels: { words: Word[] }[], size = SESSION_SIZE): PracticeQueue {
  const all = levels.flatMap((level) => level.words).filter(wordHasText);
  const usable = all.filter(hasPrompt);
  return { words: usable.slice(0, size), skipped: all.length - usable.length };
}
