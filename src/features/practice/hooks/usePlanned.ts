import { useEffect, useMemo, useRef, useState } from "react";
import { getApi, isDesktop } from "../../../shared/api";
import { useCourseLevels, wordHasText, type Word } from "../../home";
import { hasPrompt, type PoolWord } from "../model/exercises";
import { SESSION_SIZE } from "../model/queue";
import type { PracticeKind } from "./usePracticeSession";

export interface Planned {
  words: Word[];
  skipped: number;
  /** Every word of the course, used for the wrong options of choice exercises. */
  pool: PoolWord[];
  /** Card state of each planned word. */
  states: Record<string, number>;
  /** Why there is nothing to practice, shown instead of the screen. */
  empty: string | null;
}

const formatDue = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

/** Chooses the words of a session: new words to learn, or words that are due (desktop), in the order of the course. */
export function usePlanned(courseId: string, kind: PracticeKind, round: number, levelId: string | null): Planned | null {
  const allLevels = useCourseLevels(courseId);
  // A session can be limited to one level (from the level page).
  const levels = useMemo(() => (levelId ? allLevels.filter((level) => level.id === levelId) : allLevels), [allLevels, levelId]);
  const [result, setResult] = useState<{ key: string; planned: Planned } | null>(null);
  const key = `${courseId}:${kind}:${levelId ?? ""}:${round}`;
  const candidates = useMemo(() => {
    const all = levels.flatMap((level) => level.words).filter(wordHasText);
    const pool: PoolWord[] = allLevels.flatMap((level) => level.words.filter(wordHasText).map((word) => ({ word, levelId: level.id })));
    return { usable: all.filter(hasPrompt), skipped: all.length - all.filter(hasPrompt).length, pool };
  }, [levels, allLevels]);
  const latest = useRef(candidates);
  useEffect(() => {
    latest.current = candidates;
  });

  useEffect(() => {
    let cancelled = false;
    const { usable, skipped, pool } = latest.current;
    const byId = new Map(usable.map((w) => [w.id, w]));
    const done = (value: Planned) => {
      if (!cancelled) setResult({ key, planned: value });
    };
    if (!isDesktop()) {
      done({ words: usable.slice(0, SESSION_SIZE), skipped, pool, states: {}, empty: usable.length === 0 ? "none" : null });
      return;
    }
    getApi()
      .study.plan(courseId, kind, usable.map((w) => w.id))
      .then((result) => {
        if (!result.ok) return done({ words: [], skipped, pool, states: {}, empty: "Your progress could not be read. Try again." });
        const words = result.data.wordIds.flatMap((id) => byId.get(id) ?? []);
        let empty: string | null = null;
        if (words.length === 0) {
          if (usable.length === 0) empty = "none";
          else if (kind === "learn") {
            empty = result.data.newLeft === 0 ? "You have learned all the new words planned for today. Come back tomorrow, or raise the daily limit in the course options." : "There are no new words left in this course. Try a review.";
          } else {
            empty = result.data.nextDueAt ? `Nothing to review right now. The next words are due ${formatDue(result.data.nextDueAt)}.` : "Nothing to review yet. Learn some new words first.";
          }
        }
        done({ words, skipped, pool, states: result.data.states, empty });
      })
      .catch(() => done({ words: [], skipped, pool, states: {}, empty: "Your progress could not be read. Try again." }));
    return () => {
      cancelled = true;
    };
  }, [courseId, kind, round, key]);

  // A result planned for another course, kind or round is never shown.
  return result?.key === key ? result.planned : null;
}

