import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { z } from "zod";

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
  points: z.number().int().min(0).max(100),
});
export const EndSessionSchema = z.object({
  sessionId: z.string().min(1).max(100),
  status: z.enum(["completed", "abandoned"]),
});

export type StartSession = z.infer<typeof StartSessionSchema>;
export type Outcome = z.infer<typeof OutcomeSchema>;

export interface SessionSummary {
  sessionId: string;
  answered: number;
  correct: number;
  hints: number;
  points: number;
}

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
      const open = this.db.prepare("SELECT course_id FROM sessions WHERE id = ? AND status = 'open'").get(outcome.sessionId) as
        | { course_id: string }
        | undefined;
      if (!open) throw new StudyError();
      this.db
        .prepare(
          `INSERT INTO review_log (session_id, course_id, word_id, result, hints_used, attempts, elapsed_ms, points, reviewed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(outcome.sessionId, open.course_id, outcome.wordId, outcome.result, outcome.hintsUsed, outcome.attempts, outcome.elapsedMs, outcome.points, this.now().toISOString());
      this.db
        .prepare(
          `UPDATE sessions SET correct_count = correct_count + ?, hints_total = hints_total + ?, points_total = points_total + ? WHERE id = ?`,
        )
        .run(outcome.result === "gave_up" || outcome.result === "timeout" ? 0 : 1, outcome.hintsUsed, outcome.points, outcome.sessionId);
      return this.summary(outcome.sessionId);
    })();
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
