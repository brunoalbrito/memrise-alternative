import { describe, expect, it } from "vitest";
import { dueText } from "../../src/features/course-detail/model/dueText";
import { levelStats, mainAction, mainActionLabel, type StatusRow } from "../../src/features/course-detail/model/levelStats";
import { wordStatus } from "../../src/features/course-detail/model/wordStatus";
import type { Word } from "../../src/features/home/model/types";
import type { WordProgress } from "../../src/features/home/model/progress";

const NOW = new Date("2026-10-19T12:00:00Z").getTime();
const at = (ms: number) => new Date(NOW + ms).toISOString();
const MIN = 60_000;
const DAY = 86_400_000;
const card = (over: Partial<WordProgress> = {}): WordProgress => ({ learned: true, lapses: 0, dueAt: at(-1000), ignored: false, longTerm: false, ...over });
const word = (id: string, learned = false): Word => ({ id, text: id, meaning: "", example: "", images: [], audio: [], learned });
const row = (id: string, c: WordProgress | undefined): StatusRow => ({ word: word(id, c?.learned === true), status: wordStatus(c, NOW) });

describe("wordStatus", () => {
  it("a word without a card, or one only marked, is ready to learn", () => {
    expect(wordStatus(undefined, NOW)).toMatchObject({ kind: "new", due: false, dueAt: null, difficult: false });
    expect(wordStatus(card({ dueAt: "", learned: false, ignored: true }), NOW)).toMatchObject({ kind: "new", ignored: true });
  });
  it("an answered word is in review, due when its time has come", () => {
    expect(wordStatus(card({ dueAt: at(-5) }), NOW)).toMatchObject({ kind: "review", due: true });
    expect(wordStatus(card({ dueAt: at(0) }), NOW).due).toBe(true);
    expect(wordStatus(card({ dueAt: at(3 * DAY) }), NOW)).toMatchObject({ kind: "review", due: false });
  });
  it("two mistakes after learning make it difficult", () => {
    expect(wordStatus(card({ lapses: 1 }), NOW).difficult).toBe(false);
    expect(wordStatus(card({ lapses: 2 }), NOW).difficult).toBe(true);
    expect(wordStatus(card({ lapses: 5, dueAt: "" }), NOW).difficult).toBe(false); // never answered
  });
});

describe("dueText", () => {
  it("says now, then minutes, hours, days and months", () => {
    expect(dueText(at(-10 * MIN), NOW)).toBe("now");
    expect(dueText(at(0), NOW)).toBe("now");
    expect(dueText(at(1), NOW)).toBe("in 1 minute");
    expect(dueText(at(10 * MIN), NOW)).toBe("in 10 minutes");
    expect(dueText(at(60 * MIN), NOW)).toBe("in 1 hour");
    expect(dueText(at(5 * 3_600_000), NOW)).toBe("in 5 hours");
    expect(dueText(at(DAY), NOW)).toBe("in 1 day");
    expect(dueText(at(3 * DAY), NOW)).toBe("in 3 days");
    expect(dueText(at(90 * DAY), NOW)).toBe("in 3 months");
  });
});

describe("level stats and main action", () => {
  it("counts words, ignored, learned, due and new", () => {
    const rows = [
      row("a", undefined),
      row("b", card({ dueAt: at(-1) })),
      row("c", card({ dueAt: at(DAY) })),
      row("d", card({ dueAt: at(-1), ignored: true })),
      row("e", card({ dueAt: at(-1), longTerm: true })),
      row("f", card({ dueAt: "", learned: false, ignored: true })),
    ];
    expect(levelStats(rows)).toEqual({ total: 6, ignored: 2, learned: 4, due: 1, fresh: 1 });
  });
  it("reviews what is due before learning, and is disabled with nothing to do", () => {
    expect(mainAction({ total: 9, ignored: 0, learned: 2, due: 4, fresh: 3 })).toEqual({ kind: "review", count: 4 });
    expect(mainAction({ total: 9, ignored: 0, learned: 2, due: 0, fresh: 3 })).toEqual({ kind: "learn", count: 3 });
    expect(mainAction({ total: 9, ignored: 9, learned: 0, due: 0, fresh: 0 })).toEqual({ kind: "none" });
    expect(mainActionLabel({ kind: "review", count: 91 })).toBe("Review 91 words");
    expect(mainActionLabel({ kind: "review", count: 1 })).toBe("Review 1 word");
    expect(mainActionLabel({ kind: "learn", count: 2 })).toBe("Learn 2 new words");
    expect(mainActionLabel({ kind: "none" })).toBe("Nothing to practice");
  });
});
