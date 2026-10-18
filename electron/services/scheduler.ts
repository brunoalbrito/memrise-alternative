import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from "ts-fsrs";

export type Result = "correct" | "hinted" | "wrong" | "gave_up" | "timeout";
export type Kind = "learn" | "classic" | "speed";

/** The stored shape of a card (one row of the `cards` table, without the flags). */
export interface StoredCard {
  state: number;
  due_at: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  last_review_at: string | null;
}

export const DESIRED_RETENTION = 0.9;
/** "Day" rolls over at 04:00 local time, so late-night study counts for the day it started. */
export const DAY_START_HOUR = 4;
const FAST_MS = 3000;

const scheduler = fsrs(generatorParameters({ request_retention: DESIRED_RETENTION }));

/** How well a word was recalled: giving up, running out of time and any mistake mean Again; hints mean Hard. */
export function ratingFor(result: Result, kind: Kind, elapsedMs: number): Rating {
  switch (result) {
    case "gave_up":
    case "timeout":
    case "wrong":
      return Rating.Again;
    case "hinted":
      return Rating.Hard;
    case "correct":
      return kind === "speed" && elapsedMs <= FAST_MS ? Rating.Easy : Rating.Good;
  }
}

/** A word's answer counts as recalled unless the learner gave up or ran out of time. */
export const wasRecalled = (result: Result): boolean => result !== "gave_up" && result !== "timeout";

function toCard(stored: StoredCard | null, now: Date): Card {
  if (!stored) return createEmptyCard(now);
  return {
    due: new Date(stored.due_at),
    stability: stored.stability,
    difficulty: stored.difficulty,
    elapsed_days: stored.elapsed_days,
    scheduled_days: stored.scheduled_days,
    learning_steps: stored.learning_steps,
    reps: stored.reps,
    lapses: stored.lapses,
    state: stored.state as State,
    last_review: stored.last_review_at ? new Date(stored.last_review_at) : undefined,
  };
}

/** The card after one answer. `now` never goes before the last review, so a clock set back cannot give negative intervals. */
export function review(stored: StoredCard | null, rating: Rating, now: Date): StoredCard {
  const last = stored?.last_review_at ? new Date(stored.last_review_at) : null;
  const when = last && now < last ? last : now;
  const next = scheduler.next(toCard(stored, when), when, rating as Exclude<Rating, Rating.Manual>).card;
  return {
    state: next.state,
    due_at: next.due.toISOString(),
    stability: next.stability,
    difficulty: next.difficulty,
    elapsed_days: next.elapsed_days,
    scheduled_days: next.scheduled_days,
    learning_steps: next.learning_steps,
    reps: next.reps,
    lapses: next.lapses,
    last_review_at: when.toISOString(),
  };
}

/** The start of the learner's current day (04:00 local). */
export function dayStart(now: Date): Date {
  const start = new Date(now);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  return start;
}

/** Calendar key (YYYY-MM-DD) of the learner's day containing `date`. */
export function dayKey(date: Date): string {
  const shifted = new Date(date.getTime() - DAY_START_HOUR * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}
