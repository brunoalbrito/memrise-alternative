import type { CourseLevel, Word } from "./types";

export function wordHasText(word: Word): boolean {
  return word.text.trim() !== "";
}

/** Word counts of a course, derived from its levels. */
export function countsFromLevels(levels: CourseLevel[], due: number) {
  const words = levels.flatMap((level) => level.words).filter(wordHasText);
  const itemsLearned = words.filter((word) => word.learned).length;
  return {
    totalItems: words.length,
    itemsLearned,
    itemsDue: Math.min(due, itemsLearned),
  };
}
