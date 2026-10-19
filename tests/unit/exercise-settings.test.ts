import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { getEnabledExercises, setEnabledExercises } from "../../electron/services/exerciseSettings";
import { Settings } from "../../electron/services/settings";
import { Study } from "../../electron/services/study";
import { EXERCISE_KINDS } from "../../electron/shared/exercises";

let dir: string;
let ctx: ReturnType<typeof openLibrary>;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-ex-set-"));
  ctx = openLibrary(join(dir, "membetter.db"));
});
afterEach(() => {
  ctx.db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("exercise settings", () => {
  it("has every type on until changed, and remembers the choice", () => {
    const settings = new Settings(ctx.db);
    expect(getEnabledExercises(settings)).toEqual([...EXERCISE_KINDS]);
    setEnabledExercises(settings, ["word-to-image", "audio-to-word"]);
    expect(getEnabledExercises(settings)).toEqual(["word-to-image", "audio-to-word"]);
    expect(getEnabledExercises(new Settings(ctx.db))).toEqual(["word-to-image", "audio-to-word"]);
  });
  it("refuses to turn everything off and recovers from damaged data", () => {
    const settings = new Settings(ctx.db);
    expect(() => setEnabledExercises(settings, [])).toThrow(/at least one/);
    settings.set("practice.disabledExercises", "not json");
    expect(getEnabledExercises(settings)).toEqual([...EXERCISE_KINDS]);
    settings.set("practice.disabledExercises", JSON.stringify([...EXERCISE_KINDS]));
    expect(getEnabledExercises(settings).length).toBeGreaterThan(0);
  });
  it("a kind added later is on by default", () => {
    const settings = new Settings(ctx.db);
    settings.set("practice.disabledExercises", JSON.stringify(["type"]));
    expect(getEnabledExercises(settings)).not.toContain("type");
    expect(getEnabledExercises(settings)).toContain("word-to-image");
  });
});

describe("answer log and plan", () => {
  it("records which exercise produced an answer, defaulting to typing, and reports card states of planned words", () => {
    const study = new Study(ctx.db);
    const s = study.start({ courseId: "c", kind: "learn", wordCount: 2 });
    study.answer({ sessionId: s, wordId: "w1", result: "correct", hintsUsed: 0, attempts: 0, elapsedMs: 100, points: 5, exercise: "word-to-image" });
    study.answer({ sessionId: s, wordId: "w2", result: "correct", hintsUsed: 0, attempts: 0, elapsedMs: 100, points: 10 });
    expect(ctx.db.prepare("SELECT exercise FROM review_log ORDER BY id").all()).toEqual([{ exercise: "word-to-image" }, { exercise: "type" }]);
    const plan = study.plan({ courseId: "c", kind: "classic", wordIds: ["w1", "w2"] });
    expect(plan.states).toEqual({});
    expect(study.plan({ courseId: "c", kind: "learn", wordIds: ["w3"] }).states).toEqual({ w3: 0 });
  });
});
