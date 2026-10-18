import type { Course } from "../../home";

export interface Level {
  number: number;
  name: string;
  totalWords: number;
  learnedWords: number;
}

export type LevelState = "completed" | "in-progress" | "not-started";

/**
 * Splits totalItems evenly over the level names (remainder to the earliest levels) and fills
 * itemsLearned sequentially from level 1. Sums always match the course totals.
 */
export function buildLevels(course: Course, names: string[]): Level[] {
  if (course.totalItems === 0 || names.length === 0) return [];
  const base = Math.floor(course.totalItems / names.length);
  const remainder = course.totalItems % names.length;
  let learnedLeft = course.itemsLearned;
  return names.map((name, index) => {
    const totalWords = base + (index < remainder ? 1 : 0);
    const learnedWords = Math.min(totalWords, learnedLeft);
    learnedLeft -= learnedWords;
    return { number: index + 1, name, totalWords, learnedWords };
  });
}

export function levelState(level: Level): LevelState {
  if (level.totalWords > 0 && level.learnedWords === level.totalWords) {
    return "completed";
  }
  if (level.learnedWords === 0) return "not-started";
  return "in-progress";
}
