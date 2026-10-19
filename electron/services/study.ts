import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";
import { ExerciseKindSchema } from "../shared/exercises";
import { dayKey, dayStart, ratingFor, review, wasRecalled, type Kind, type StoredCard } from "./scheduler";

type Db = Database.Database;

export const SessionKindSchema = z.enum(["learn", "classic", "speed"]);
export const StartSessionSchema = z.object({
  courseId: z.string().min(1).max(100),
  kind: SessionKindSchema,
  wordCount: z.number().int().min(0).max(5000),
});
export const OutcomeSchema = z.object({
  sessionId: z.string().min(1).max(100),
  wordId: z.string().min(1).max(100),
  result: z.enum(["correct", "hinted", "wrong", "gave_up", "timeout"]),
  hintsUsed: z.number().int().min(0).max(100),
  attempts: z.number().int().min(0).max(1000),
  elapsedMs: z.number().int().min(0).max(24 * 3600 * 1000),
  points: z.number().int().min(0).max(10_000),
  exercise: ExerciseKindSchema.default("type"),
});
export const EndSessionSchema = z.object({
  sessionId: z.string().min(1).max(100),
  status: z.enum(["completed", "abandoned"]),
});

export type StartSession = z.infer<typeof StartSessionSchema>;
export type Outcome = z.input<typeof OutcomeSchema>;

export interface SessionSummary {
  sessionId: string;
  answered: number;
  correct: number;
  hints: number;
  points: number;
}

export const SESSION_LIMIT = 20;
export const LEARN_SESSION_SIZE = 10;
export const DEFAULT_NEW_PER_DAY = 10;

export const PlanSchema = z.object({
  courseId: z.string().min(1).max(100),
  kind: SessionKindSchema,
  wordIds: z.array(z.string().min(1).max(100)).max(20000),
});
export const MarkSchema = z.object({
  courseId: z.string().min(1).max(100),
  wordId: z.string().min(1).max(100),
  flag: z.enum(["ignored", "longTerm"]),
  value: z.boolean(),
});
export const MarkManySchema = z.object({
  courseId: z.string().min(1).max(100),
  wordIds: z.array(z.string().min(1).max(100)).min(1).max(20000),
  flag: z.enum(["ignored", "longTerm"]),
  value: z.boolean(),
});
export const NewPerDaySchema = z.object({ courseId: z.string().min(1).max(100), value: z.number().int().min(1).max(100) });
export const SpeedScoreSchema = z.object({ courseId: z.string().min(1).max(100), score: z.number().int().min(0).max(1_000_000) });
export interface SpeedBest {
  /** Best speed review score of the course, or null before the first game. */
  best: number | null;
  /** The score just saved beat the earlier best (or was the first above zero). */
  improved: boolean;
}
export const CourseIdSchema = z.object({ courseId: z.string().min(1).max(100) });

export interface Plan {
  /** Words to practice, in order. */
  wordIds: string[];
  /** Cards due now (not ignored, not long-term). */
  dueCount: number;
  /** New words that can still be introduced today. */
  newLeft: number;
  /** When the next card falls due, if none is due now. */
  nextDueAt: string | null;
  /** Card state of each planned word: 0 new, 1 learning, 2 review, 3 relearning. */
  states: Record<string, number>;
}

export interface CardProgress {
  learned: boolean;
  /** Mistakes made after the word was learned. */
  lapses: number;
  dueAt: string;
  ignored: boolean;
  longTerm: boolean;
}

export interface Progress {
  cards: Record<string, CardProgress>;
  /** Words practiced (and not given up) today, per course. */
  practicedToday: Record<string, number>;
  newPerDay: Record<string, number>;
}

export interface CourseStats {
  streakDays: number;
  /** Reviews per day for the last 14 days, oldest first. */
  last14: { day: string; reviews: number }[];
  /** Share of answers in the last 30 days that were recalled, or null without reviews. */
  recallPercent: number | null;
  totalReviews: number;
  learned: number;
  ignored: number;
  longTerm: number;
}

/** One word's study state as stored in `progress.json` of an exported file. */
export const CardExportSchema = z.object({
  wordId: z.string().min(1).max(100),
  state: z.number().int().min(0).max(3),
  dueAt: z.string().max(40),
  stability: z.number().min(0),
  difficulty: z.number().min(0),
  elapsedDays: z.number().int().min(0),
  scheduledDays: z.number().int().min(0),
  learningSteps: z.number().int().min(0),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  lastReviewAt: z.string().max(40).nullable(),
  learnedAt: z.string().max(40).nullable(),
  ignored: z.boolean(),
  inLongTerm: z.boolean(),
});
export const ProgressFileSchema = z.object({ cards: z.array(CardExportSchema).max(100000) });
export type CardExport = z.infer<typeof CardExportSchema>;

export class StudyError extends Error {
  readonly code = "not_found";
  constructor() {
    super("This practice session is no longer open.");
    this.name = "StudyError";
  }
}

/**
 * Practice sessions and the log of every answer. `result` is how the word ended: correct, hinted (correct after hints),
 * wrong (correct after at least one mistake: one lapse), gave_up or timeout. Scheduling is built on top of this log.
 */
export class Study {
  constructor(
    private readonly db: Db,
    private readonly now: () => Date = () => new Date(),
  ) {}

  /** Sessions left open by a crash or a closed window are marked abandoned; their answers stay recorded. */
  abandonOpenSessions(): number {
    return this.db
      .prepare("UPDATE sessions SET status = 'abandoned', ended_at = ? WHERE status = 'open'")
      .run(this.now().toISOString()).changes;
  }

  start(input: StartSession): string {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO sessions (id, course_id, kind, started_at, word_count) VALUES (?, ?, ?, ?, ?)")
      .run(id, input.courseId, input.kind, this.now().toISOString(), input.wordCount);
    return id;
  }

  answer(outcome: Outcome): SessionSummary {
    return this.db.transaction(() => {
      const open = this.db.prepare("SELECT course_id, kind FROM sessions WHERE id = ? AND status = 'open'").get(outcome.sessionId) as
        | { course_id: string; kind: Kind }
        | undefined;
      if (!open) throw new StudyError();
      this.reviewCard(open.course_id, open.kind, outcome);
      this.db
        .prepare(
          `INSERT INTO review_log (session_id, course_id, word_id, result, hints_used, attempts, elapsed_ms, points, reviewed_at, exercise)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(outcome.sessionId, open.course_id, outcome.wordId, outcome.result, outcome.hintsUsed, outcome.attempts, outcome.elapsedMs, outcome.points, this.now().toISOString(), outcome.exercise ?? "type");
      this.db
        .prepare(
          `UPDATE sessions SET correct_count = correct_count + ?, hints_total = hints_total + ?, points_total = points_total + ? WHERE id = ?`,
        )
        .run(outcome.result === "gave_up" || outcome.result === "timeout" ? 0 : 1, outcome.hintsUsed, outcome.points, outcome.sessionId);
      return this.summary(outcome.sessionId);
    })();
  }

  private reviewCard(courseId: string, kind: Kind, outcome: Outcome): void {
    const now = this.now();
    const row = this.db.prepare("SELECT * FROM cards WHERE word_id = ?").get(outcome.wordId) as
      | (StoredCard & { learned_at: string | null })
      | undefined;
    const next = review(row ?? null, ratingFor(outcome.result, kind, outcome.elapsedMs), now);
    const learnedAt = row?.learned_at ?? (wasRecalled(outcome.result) ? now.toISOString() : null);
    this.db
      .prepare(
        `INSERT INTO cards (word_id, course_id, state, due_at, stability, difficulty, elapsed_days, scheduled_days,
           learning_steps, reps, lapses, last_review_at, learned_at, created_at, updated_at)
         VALUES (@word_id, @course_id, @state, @due_at, @stability, @difficulty, @elapsed_days, @scheduled_days,
           @learning_steps, @reps, @lapses, @last_review_at, @learned_at, @at, @at)
         ON CONFLICT (word_id) DO UPDATE SET state = @state, due_at = @due_at, stability = @stability,
           difficulty = @difficulty, elapsed_days = @elapsed_days, scheduled_days = @scheduled_days,
           learning_steps = @learning_steps, reps = @reps, lapses = @lapses, last_review_at = @last_review_at,
           learned_at = @learned_at, updated_at = @at`,
      )
      .run({ ...next, word_id: outcome.wordId, course_id: courseId, learned_at: learnedAt, at: now.toISOString() });
  }

  /**
   * Which words a session should contain. Learn: words that are new, in the given order, up to the daily limit.
   * Classic and speed review: cards that are due, oldest first. Ignored words are never included.
   */
  plan(input: z.infer<typeof PlanSchema>): Plan {
    const now = this.now();
    const ids = JSON.stringify(input.wordIds);
    const rows = this.db
      .prepare(
        `SELECT word_id, state, due_at, ignored, in_long_term FROM cards WHERE word_id IN (SELECT value FROM json_each(?))`,
      )
      .all(ids) as { word_id: string; state: number; due_at: string; ignored: number; in_long_term: number }[];
    const byId = new Map(rows.map((r) => [r.word_id, r]));

    const dueRows = rows
      .filter((r) => r.state !== 0 && r.ignored === 0 && r.in_long_term === 0 && new Date(r.due_at) <= now)
      .sort((a, b) => a.due_at.localeCompare(b.due_at));
    const upcoming = rows
      .filter((r) => r.state !== 0 && r.ignored === 0 && r.in_long_term === 0 && new Date(r.due_at) > now)
      .map((r) => r.due_at)
      .sort()[0];

    const perDay = this.newPerDay(input.courseId);
    const startedToday = this.db
      .prepare("SELECT COUNT(*) AS n FROM cards WHERE course_id = ? AND state != 0 AND created_at >= ?")
      .get(input.courseId, dayStart(now).toISOString()) as { n: number };
    const newLeft = Math.max(0, perDay - startedToday.n);

    const isNew = (id: string) => {
      const card = byId.get(id);
      return !card || (card.state === 0 && card.ignored === 0);
    };
    const wordIds =
      input.kind === "learn"
        ? input.wordIds.filter(isNew).slice(0, Math.min(LEARN_SESSION_SIZE, newLeft))
        : dueRows.map((r) => r.word_id).slice(0, SESSION_LIMIT);
    const states: Record<string, number> = {};
    for (const id of wordIds) states[id] = byId.get(id)?.state ?? 0;
    return { wordIds, dueCount: dueRows.length, newLeft, nextDueAt: dueRows.length === 0 ? (upcoming ?? null) : null, states, };
  }

  /** Cards of these words, for export. */
  cardsFor(wordIds: string[]): CardExport[] {
    return (
      this.db.prepare("SELECT * FROM cards WHERE word_id IN (SELECT value FROM json_each(?))").all(JSON.stringify(wordIds)) as Record<
        string,
        string | number | null
      >[]
    ).map((r) => ({
      wordId: r["word_id"] as string,
      state: r["state"] as number,
      dueAt: r["due_at"] as string,
      stability: r["stability"] as number,
      difficulty: r["difficulty"] as number,
      elapsedDays: r["elapsed_days"] as number,
      scheduledDays: r["scheduled_days"] as number,
      learningSteps: r["learning_steps"] as number,
      reps: r["reps"] as number,
      lapses: r["lapses"] as number,
      lastReviewAt: r["last_review_at"] as string | null,
      learnedAt: r["learned_at"] as string | null,
      ignored: r["ignored"] === 1,
      inLongTerm: r["in_long_term"] === 1,
    }));
  }

  /** Stores imported cards for the given (new) word ids of a course. Existing cards of those ids are replaced. */
  importCards(courseId: string, cards: CardExport[]): void {
    const now = this.now().toISOString();
    const insert = this.db.prepare(
      `INSERT INTO cards (word_id, course_id, state, due_at, stability, difficulty, elapsed_days, scheduled_days, learning_steps,
         reps, lapses, last_review_at, learned_at, ignored, in_long_term, created_at, updated_at)
       VALUES (@wordId, @courseId, @state, @dueAt, @stability, @difficulty, @elapsedDays, @scheduledDays, @learningSteps,
         @reps, @lapses, @lastReviewAt, @learnedAt, @ignored, @inLongTerm, @now, @now)
       ON CONFLICT (word_id) DO UPDATE SET course_id = @courseId, state = @state, due_at = @dueAt, stability = @stability,
         difficulty = @difficulty, elapsed_days = @elapsedDays, scheduled_days = @scheduledDays, learning_steps = @learningSteps,
         reps = @reps, lapses = @lapses, last_review_at = @lastReviewAt, learned_at = @learnedAt, ignored = @ignored,
         in_long_term = @inLongTerm, updated_at = @now`,
    );
    for (const c of cards) insert.run({ ...c, courseId, ignored: c.ignored ? 1 : 0, inLongTerm: c.inLongTerm ? 1 : 0, now });
  }

  /** Best speed review score of a course. */
  speedBest(courseId: string): number | null {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(`speed.best.${courseId}`) as { value: string } | undefined;
    const score = row ? Number(row.value) : NaN;
    return Number.isFinite(score) ? score : null;
  }

  /** Remembers a score when it is the best so far for the course. */
  saveSpeedScore(courseId: string, score: number): SpeedBest {
    const previous = this.speedBest(courseId);
    const improved = score > 0 && (previous === null || score > previous);
    if (improved) {
      this.db
        .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
        .run(`speed.best.${courseId}`, String(score));
    }
    return { best: improved ? score : previous, improved };
  }

  newPerDay(courseId: string): number {
    const row = this.db.prepare("SELECT new_per_day FROM course_settings WHERE course_id = ?").get(courseId) as
      | { new_per_day: number }
      | undefined;
    return row?.new_per_day ?? DEFAULT_NEW_PER_DAY;
  }

  setNewPerDay(courseId: string, value: number): void {
    this.db
      .prepare(
        `INSERT INTO course_settings (course_id, new_per_day) VALUES (?, ?)
         ON CONFLICT (course_id) DO UPDATE SET new_per_day = excluded.new_per_day`,
      )
      .run(courseId, value);
  }

  /** Ignore or long-term flag for a word, creating a "new" card row when the word has none yet. */
  mark(input: z.infer<typeof MarkSchema>): void {
    this.markMany({ courseId: input.courseId, wordIds: [input.wordId], flag: input.flag, value: input.value });
  }

  /** The same flag for many words in one step (all or nothing). */
  markMany(input: z.infer<typeof MarkManySchema>): void {
    const now = this.now().toISOString();
    const column = input.flag === "ignored" ? "ignored" : "in_long_term";
    const create = this.db.prepare(
      `INSERT INTO cards (word_id, course_id, state, due_at, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?)
       ON CONFLICT (word_id) DO NOTHING`,
    );
    const update = this.db.prepare(`UPDATE cards SET ${column} = ?, updated_at = ? WHERE word_id = ?`);
    this.db.transaction(() => {
      for (const wordId of input.wordIds) {
        create.run(wordId, input.courseId, now, now, now);
        update.run(input.value ? 1 : 0, now, wordId);
      }
    })();
  }

  /** What the learner has learned and what is due, for every word with a card. */
  progress(): Progress {
    const cards: Record<string, CardProgress> = {};
    for (const r of this.db.prepare("SELECT word_id, state, due_at, learned_at, ignored, in_long_term, lapses FROM cards").all() as {
      word_id: string;
      state: number;
      due_at: string;
      learned_at: string | null;
      ignored: number;
      in_long_term: number;
      lapses: number;
    }[]) {
      cards[r.word_id] = { learned: r.learned_at !== null, lapses: r.lapses, dueAt: r.state === 0 ? "" : r.due_at, ignored: r.ignored === 1, longTerm: r.in_long_term === 1 };
    }
    const practicedToday: Record<string, number> = {};
    for (const r of this.db
      .prepare(
        `SELECT course_id, COUNT(DISTINCT word_id) AS n FROM review_log
         WHERE reviewed_at >= ? AND result NOT IN ('gave_up', 'timeout') GROUP BY course_id`,
      )
      .all(dayStart(this.now()).toISOString()) as { course_id: string; n: number }[]) {
      practicedToday[r.course_id] = r.n;
    }
    const newPerDay: Record<string, number> = {};
    for (const r of this.db.prepare("SELECT course_id, new_per_day FROM course_settings WHERE new_per_day != ?").all(DEFAULT_NEW_PER_DAY) as {
      course_id: string;
      new_per_day: number;
    }[]) {
      newPerDay[r.course_id] = r.new_per_day;
    }
    return { cards, practicedToday, newPerDay };
  }

  stats(courseId: string): CourseStats {
    const now = this.now();
    const times = this.db
      .prepare("SELECT reviewed_at AS at, result FROM review_log WHERE course_id = ? ORDER BY reviewed_at")
      .all(courseId) as { at: string; result: string }[];
    const perDay = new Map<string, number>();
    for (const t of times) {
      const key = dayKey(new Date(t.at));
      perDay.set(key, (perDay.get(key) ?? 0) + 1);
    }
    const last14: CourseStats["last14"] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const day = dayKey(new Date(now.getTime() - i * 86_400_000));
      last14.push({ day, reviews: perDay.get(day) ?? 0 });
    }
    // The streak counts back from today, or from yesterday when nothing was practiced yet today.
    let streak = 0;
    for (let i = perDay.has(dayKey(now)) ? 0 : 1; ; i += 1) {
      if (!perDay.has(dayKey(new Date(now.getTime() - i * 86_400_000)))) break;
      streak += 1;
    }
    const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
    const recent = times.filter((t) => t.at >= since);
    const recalled = recent.filter((t) => t.result !== "gave_up" && t.result !== "timeout").length;
    const flags = this.db
      .prepare(
        `SELECT COALESCE(SUM(learned_at IS NOT NULL), 0) AS learned, COALESCE(SUM(ignored), 0) AS ignored,
                COALESCE(SUM(in_long_term), 0) AS longTerm FROM cards WHERE course_id = ?`,
      )
      .get(courseId) as { learned: number; ignored: number; longTerm: number };
    return {
      streakDays: streak,
      last14,
      recallPercent: recent.length === 0 ? null : Math.round((recalled / recent.length) * 100),
      totalReviews: times.length,
      ...flags,
    };
  }

  end(sessionId: string, status: "completed" | "abandoned"): SessionSummary {
    this.db.prepare("UPDATE sessions SET status = ?, ended_at = ? WHERE id = ? AND status = 'open'").run(status, this.now().toISOString(), sessionId);
    return this.summary(sessionId);
  }

  summary(sessionId: string): SessionSummary {
    const row = this.db
      .prepare(
        `SELECT s.correct_count AS correct, s.hints_total AS hints, s.points_total AS points,
                (SELECT COUNT(*) FROM review_log WHERE session_id = s.id) AS answered
         FROM sessions s WHERE s.id = ?`,
      )
      .get(sessionId) as { correct: number; hints: number; points: number; answered: number } | undefined;
    if (!row) throw new StudyError();
    return { sessionId, ...row };
  }
}
