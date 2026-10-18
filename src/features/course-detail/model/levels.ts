import { wordHasText, type CourseLevel } from "../../home";

export interface Level {
  number: number;
  name: string;
  totalWords: number;
  learnedWords: number;
}

export type LevelState = "completed" | "in-progress" | "not-started";

/** Course page view of the stored levels. */
export function levelViews(levels: CourseLevel[]): Level[] {
  return levels.map((level, index) => {
    const words = level.words.filter(wordHasText);
    return {
      number: index + 1,
      name: level.name,
      totalWords: words.length,
      learnedWords: words.filter((word) => word.learned).length,
    };
  });
}

export function levelState(level: Level): LevelState {
  if (level.totalWords > 0 && level.learnedWords === level.totalWords) {
    return "completed";
  }
  if (level.learnedWords === 0) return "not-started";
  return "in-progress";
}
