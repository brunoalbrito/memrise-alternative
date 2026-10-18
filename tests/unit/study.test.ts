import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { dayKey, dayStart, ratingFor } from "../../electron/services/scheduler";
import { Study, type Outcome } from "../../electron/services/study";

let dir: string;
let db: Database.Database;
let clock: Date;
let study: Study;
const at = (iso: string) => new Date(iso);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-study-"));
  db = openLibrary(join(dir, "membetter.db")).db;
  clock = at("2026-10-19T10:00:00");
  study = new Study(db, () => clock);
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const ids = (n: number) => Array.from({ length: n }, (_, i) => `w${i + 1}`);
const outcome = (sessionId: string, wordId: string, result: Outcome["result"] = "correct", extra: Partial<Outcome> = {}): Outcome => ({
  sessionId,
  wordId,
  result,
  hintsUsed: 0,
  attempts: 0,
  elapsedMs: 5000,
  points: 10,
  ...extra,
});
const answerAll = (kind: "learn" | "classic" | "speed", words: string[], result: Outcome["result"] = "correct") => {
  const sessionId = study.start({ courseId: "c", kind, wordCount: words.length });
  for (const w of words) study.answer(outcome(sessionId, w, result));
  study.end(sessionId, "completed");
};
const card = (id: string) => db.prepare("SELECT * FROM cards WHERE word_id = ?").get(id) as Record<string, string | number | null>;
const hours = (h: number) => new Date(clock.getTime() + h * 3_600_000);

describe("planning", () => {
  it("learn: new words in order, up to the daily limit and session size", () => {
    const plan = study.plan({ courseId: "c", kind: "learn", wordIds: ids(30) });
    expect(plan.wordIds).toEqual(ids(10));
    expect(plan.newLeft).toBe(10);
    study.setNewPerDay("c", 5);
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ids(30) }).wordIds).toEqual(ids(5));
  });

  it("learn skips words that already have a card and ignored words", () => {
    answerAll("learn", ["w1", "w2"]);
    study.mark({ courseId: "c", wordId: "w3", flag: "ignored", value: true });
    const plan = study.plan({ courseId: "c", kind: "learn", wordIds: ids(6) });
    expect(plan.wordIds).toEqual(["w4", "w5", "w6"]);
    expect(plan.newLeft).toBe(8); // two words started today
  });

  it("the daily new-word allowance is used up and returns the next day", () => {
    study.setNewPerDay("c", 2);
    answerAll("learn", ["w1", "w2"]);
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ids(6) }).wordIds).toEqual([]);
    clock = at("2026-10-20T10:00:00");
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ids(6) }).wordIds).toEqual(["w3", "w4"]);
  });

  it("classic review: nothing is due right after learning, then the words come back oldest first", () => {
    answerAll("learn", ["w1", "w2", "w3"]);
    const first = study.plan({ courseId: "c", kind: "classic", wordIds: ids(3) });
    expect(first.wordIds).toEqual([]);
    expect(first.dueCount).toBe(0);
    expect(first.nextDueAt).not.toBeNull();
    clock = hours(48);
    const later = study.plan({ courseId: "c", kind: "classic", wordIds: ids(3) });
    expect(later.wordIds).toEqual(["w1", "w2", "w3"]);
    expect(later.dueCount).toBe(3);
    expect(later.nextDueAt).toBeNull();
  });

  it("speed review uses the same due words", () => {
    answerAll("learn", ["w1"]);
    clock = hours(48);
    expect(study.plan({ courseId: "c", kind: "speed", wordIds: ids(3) }).wordIds).toEqual(["w1"]);
  });

  it("ignored and long-term words are left out of review, and can be unmarked", () => {
    answerAll("learn", ["w1", "w2", "w3"]);
    clock = hours(48);
    study.mark({ courseId: "c", wordId: "w1", flag: "ignored", value: true });
    study.mark({ courseId: "c", wordId: "w2", flag: "longTerm", value: true });
    expect(study.plan({ courseId: "c", kind: "classic", wordIds: ids(3) }).wordIds).toEqual(["w3"]);
    study.mark({ courseId: "c", wordId: "w1", flag: "ignored", value: false });
    expect(study.plan({ courseId: "c", kind: "classic", wordIds: ids(3) }).wordIds).toEqual(["w1", "w3"]);
  });
});

describe("scheduling answers", () => {
  it("a correct answer pushes the due date out further than a mistake", () => {
    answerAll("learn", ["good", "bad"]);
    clock = hours(48);
    const s = study.start({ courseId: "c", kind: "classic", wordCount: 2 });
    study.answer(outcome(s, "good", "correct"));
    study.answer(outcome(s, "bad", "wrong", { attempts: 1 }));
    expect(new Date(card("good")["due_at"] as string).getTime()).toBeGreaterThan(new Date(card("bad")["due_at"] as string).getTime());
  });

  it("a mistake on a word that was in long-term review counts as a lapse", () => {
    for (let round = 0; round < 3; round += 1) {
      const s = study.start({ courseId: "c", kind: "classic", wordCount: 1 });
      study.answer(outcome(s, "w1"));
      clock = new Date(card("w1")["due_at"] as string);
    }
    expect(card("w1")["state"]).toBe(2); // review
    const s = study.start({ courseId: "c", kind: "classic", wordCount: 1 });
    study.answer(outcome(s, "w1", "wrong", { attempts: 2 }));
    expect(card("w1")["lapses"]).toBe(1);
    expect(card("w1")["state"]).toBe(3); // relearning
  });

  it("repeated correct answers space reviews further and further apart", () => {
    let gap = 0;
    for (let round = 0; round < 4; round += 1) {
      const s = study.start({ courseId: "c", kind: "classic", wordCount: 1 });
      study.answer(outcome(s, "w1"));
      const due = new Date(card("w1")["due_at"] as string);
      const next = due.getTime() - clock.getTime();
      expect(next).toBeGreaterThan(gap);
      gap = next;
      clock = due;
    }
  });

  it("hints schedule sooner than a clean answer", () => {
    answerAll("learn", ["a", "b"]);
    clock = hours(72);
    const s = study.start({ courseId: "c", kind: "classic", wordCount: 2 });
    study.answer(outcome(s, "a", "correct"));
    study.answer(outcome(s, "b", "hinted", { hintsUsed: 1 }));
    expect(new Date(card("a")["due_at"] as string).getTime()).toBeGreaterThan(new Date(card("b")["due_at"] as string).getTime());
  });

  it("a word is learned on its first recalled answer, not when the learner gives up", () => {
    answerAll("learn", ["w1"], "gave_up");
    expect(card("w1")["learned_at"]).toBeNull();
    const s = study.start({ courseId: "c", kind: "learn", wordCount: 1 });
    study.answer(outcome(s, "w1"));
    expect(card("w1")["learned_at"]).not.toBeNull();
    expect(study.progress().cards["w1"]).toMatchObject({ learned: true });
  });

  it("a clock set back never makes the next review earlier than the last one", () => {
    answerAll("learn", ["w1"]);
    const before = card("w1");
    clock = new Date(clock.getTime() - 5 * 86_400_000);
    const s = study.start({ courseId: "c", kind: "classic", wordCount: 1 });
    study.answer(outcome(s, "w1"));
    const after = card("w1");
    expect(new Date(after["due_at"] as string).getTime()).toBeGreaterThanOrEqual(new Date(before["last_review_at"] as string).getTime());
    expect(after["scheduled_days"] as number).toBeGreaterThanOrEqual(0);
    expect(after["elapsed_days"] as number).toBeGreaterThanOrEqual(0);
  });

  it("rejects answers for a session that is not open", () => {
    const s = study.start({ courseId: "c", kind: "learn", wordCount: 1 });
    study.end(s, "completed");
    expect(() => study.answer(outcome(s, "w1"))).toThrow(/no longer open/);
  });
});

describe("rating", () => {
  it("maps outcomes to ratings", () => {
    expect(ratingFor("correct", "classic", 9000)).toBe(3);
    expect(ratingFor("correct", "speed", 1500)).toBe(4);
    expect(ratingFor("correct", "speed", 9000)).toBe(3);
    expect(ratingFor("hinted", "learn", 1000)).toBe(2);
    for (const r of ["wrong", "gave_up", "timeout"] as const) expect(ratingFor(r, "learn", 1000)).toBe(1);
  });
});

describe("days", () => {
  it("rolls the day over at 04:00 local time", () => {
    expect(dayStart(at("2026-10-19T03:59:00")).getDate()).toBe(18);
    expect(dayStart(at("2026-10-19T04:00:00")).getDate()).toBe(19);
    expect(dayKey(at("2026-10-19T02:00:00"))).toBe("2026-10-18");
    expect(dayKey(at("2026-10-19T12:00:00"))).toBe("2026-10-19");
  });
});

describe("progress and statistics", () => {
  it("counts words practiced today per course, and flags", () => {
    answerAll("learn", ["w1", "w2"]);
    const s = study.start({ courseId: "c", kind: "learn", wordCount: 1 });
    study.answer(outcome(s, "w3", "gave_up"));
    study.mark({ courseId: "c", wordId: "w2", flag: "longTerm", value: true });
    const p = study.progress();
    expect(p.practicedToday).toEqual({ c: 2 });
    expect(p.cards["w2"]).toMatchObject({ learned: true, longTerm: true, ignored: false });
    expect(p.cards["w3"]).toMatchObject({ learned: false });
    expect(study.stats("c")).toMatchObject({ learned: 2, longTerm: 1, ignored: 0, totalReviews: 3, recallPercent: 67 });
  });

  it("marks many words at once, including words never practiced, and reports lapses", () => {
    answerAll("learn", ["w1"]);
    study.markMany({ courseId: "c", wordIds: ["w1", "w2", "w3"], flag: "ignored", value: true });
    const p = study.progress().cards;
    expect(["w1", "w2", "w3"].map((id) => p[id]?.ignored)).toEqual([true, true, true]);
    expect(p["w1"]).toMatchObject({ learned: true, lapses: 0 });
    expect(p["w2"]).toMatchObject({ learned: false, dueAt: "" });
    study.markMany({ courseId: "c", wordIds: ["w1", "w2"], flag: "ignored", value: false });
    expect(study.progress().cards["w2"]!.ignored).toBe(false);
    expect(study.progress().cards["w3"]!.ignored).toBe(true);
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ["w2", "w3"] }).wordIds).toEqual(["w2"]);
  });

  it("a new word marked ignored stays new and is excluded from learn", () => {
    study.mark({ courseId: "c", wordId: "w1", flag: "ignored", value: true });
    expect(study.progress().cards["w1"]).toMatchObject({ learned: false, ignored: true, dueAt: "" });
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ["w1", "w2"] }).wordIds).toEqual(["w2"]);
  });

  it("streak counts consecutive days, from yesterday if today has no practice yet", () => {
    for (const day of ["2026-10-16", "2026-10-17", "2026-10-18"]) {
      clock = at(`${day}T12:00:00`);
      answerAll("learn", [`x${day}`]);
    }
    clock = at("2026-10-19T09:00:00");
    expect(study.stats("c").streakDays).toBe(3);
    answerAll("learn", ["today"]);
    expect(study.stats("c").streakDays).toBe(4);
    clock = at("2026-10-22T09:00:00");
    expect(study.stats("c").streakDays).toBe(0);
    const last14 = study.stats("c").last14;
    expect(last14).toHaveLength(14);
    expect(last14.at(-1)!.day).toBe("2026-10-22");
  });

  it("abandons sessions left open", () => {
    study.start({ courseId: "c", kind: "learn", wordCount: 3 });
    expect(study.abandonOpenSessions()).toBe(1);
    expect(db.prepare("SELECT status FROM sessions").all()).toEqual([{ status: "abandoned" }]);
  });
});
