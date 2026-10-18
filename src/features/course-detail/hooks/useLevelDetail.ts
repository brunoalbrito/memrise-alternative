import { useMemo } from "react";
import { getApi, isDesktop } from "../../../shared/api";
import { useCourse, useCourseLevels, useProgressStore } from "../../home";
import { levelStats, mainAction, type StatusRow } from "../model/levelStats";
import { levelState } from "../model/levels";
import { wordStatus } from "../model/wordStatus";
import { wordHasText } from "../../home";

/** Everything the level page shows, derived from the course and the learner's progress. */
export function useLevelDetail(courseId: string, levelParam: string) {
  const course = useCourse(courseId);
  const levels = useCourseLevels(courseId);
  const cards = useProgressStore((state) => state.cards);
  const now = useProgressStore((state) => state.asOf);

  const number = /^\d+$/.test(levelParam) ? Number(levelParam) : NaN;
  const level = Number.isInteger(number) ? levels[number - 1] : undefined;

  const rows: StatusRow[] = useMemo(
    () => (level?.words ?? []).filter(wordHasText).map((word) => ({ word, status: wordStatus(cards[word.id], now) })),
    [level, cards, now],
  );
  const stats = useMemo(() => levelStats(rows), [rows]);

  const neighbour = (i: number) => (levels[i] ? { number: i + 1, name: levels[i]!.name } : undefined);

  /** Ignores or restores words: shown at once, saved in the background, and put right again if saving fails. */
  const setIgnored = async (wordIds: string[], ignored: boolean) => {
    if (wordIds.length === 0) return;
    const progress = useProgressStore.getState();
    progress.patchCards(wordIds, { ignored });
    if (!isDesktop()) return;
    try {
      const result = await getApi().study.markMany(courseId, wordIds, "ignored", ignored);
      if (!result.ok) throw new Error(result.error.message);
    } finally {
      await progress.refresh();
    }
  };

  return {
    course,
    levels,
    level,
    number,
    rows,
    stats,
    now,
    action: mainAction(stats),
    stage: level ? levelStateStage(stats.learned, stats.total) : ("pot" as const),
    previous: neighbour(number - 2),
    next: neighbour(number),
    setIgnored,
  };
}

function levelStateStage(learned: number, total: number): "pot" | "growing" | "flower" {
  const state = levelState({ number: 0, name: "", totalWords: total, learnedWords: learned });
  return state === "completed" ? "flower" : state === "in-progress" ? "growing" : "pot";
}
