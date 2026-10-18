import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { applyChange, loadLibrary, purgeTrash } from "../../electron/services/library";
import { LibraryChangeSchema, type CourseData, type CourseLevelData } from "../../electron/shared/schemas";

let dir: string;
let db: Database.Database;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-lib-"));
  db = openLibrary(join(dir, "membetter.db")).db;
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const course = (id = "custom-1"): CourseData => ({
  id,
  title: "My course",
  categoryId: "lang-en-gb",
  teaching: true,
  totalItems: 0,
  itemsLearned: 0,
  itemsDue: 0,
  learnedToday: 0,
  teachingLanguageId: "en-gb",
  speakersLanguageId: "pt-br",
  tags: ["a", "b"],
  description: "desc",
});

const level = (id: string, words: string[]): CourseLevelData => ({
  id,
  name: `Level ${id}`,
  tested: "Test on Word",
  words: words.map((text, i) => ({
    id: `${id}-w${i}`,
    text,
    meaning: `meaning of ${text}`,
    example: "",
    ipa: i === 0 ? "ˈsɪŋk" : undefined,
    images: i === 0 ? [{ id: "m1", name: "a.png", type: "image/png", size: 10 }] : [],
    audio: [],
    learned: i === 1,
  })),
});

describe("library service", () => {
  it("starts empty", () => {
    expect(loadLibrary(db)).toEqual({
      createdCourses: [],
      courseEdits: {},
      courseLevels: {},
      goals: {},
      removedCourseIds: [],
    });
  });

  it("round-trips a course with levels and words", () => {
    applyChange(db, { type: "upsertCourse", course: course() });
    applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: [level("l1", ["sink", "wash"]), level("l2", ["pillow"])] });
    const snap = loadLibrary(db);
    expect(snap.createdCourses).toEqual([course()]);
    expect(snap.courseLevels["custom-1"]).toEqual([level("l1", ["sink", "wash"]), level("l2", ["pillow"])]);
  });

  it("applies later level saves as add, reorder, edit and delete", () => {
    applyChange(db, { type: "upsertCourse", course: course() });
    applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: [level("l1", ["a", "b", "c"]), level("l2", ["d"])] });
    const next = [level("l2", ["d"]), { ...level("l1", ["a", "c"]), name: "Renamed" }];
    applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: next });
    expect(loadLibrary(db).courseLevels["custom-1"]).toEqual(next);
    expect(db.prepare("SELECT COUNT(*) AS n FROM words").get()).toEqual({ n: 3 });
    applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: [] });
    expect(db.prepare("SELECT COUNT(*) AS n FROM levels").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM words").get()).toEqual({ n: 0 });
  });

  it("stores goals, hidden courses and sample edits", () => {
    applyChange(db, { type: "setGoal", courseId: "sample-a", value: 20 });
    applyChange(db, { type: "setEdit", courseId: "sample-a", edit: { title: "Edited" } });
    applyChange(db, { type: "hideCourse", courseId: "sample-b" });
    let snap = loadLibrary(db);
    expect(snap.goals).toEqual({ "sample-a": 20 });
    expect(snap.courseEdits).toEqual({ "sample-a": { title: "Edited" } });
    expect(snap.removedCourseIds).toEqual(["sample-b"]);

    applyChange(db, { type: "setGoal", courseId: "sample-a", value: null });
    applyChange(db, { type: "restoreHidden" });
    snap = loadLibrary(db);
    expect(snap.goals).toEqual({});
    expect(snap.removedCourseIds).toEqual([]);
  });

  it("hiding a sample drops its edits and levels, keeping the goal row valid", () => {
    applyChange(db, { type: "setEdit", courseId: "sample-a", edit: { title: "Edited" } });
    applyChange(db, { type: "saveLevels", courseId: "sample-a", levels: [level("sl", ["x"])] });
    applyChange(db, { type: "hideCourse", courseId: "sample-a" });
    const snap = loadLibrary(db);
    expect(snap.courseEdits).toEqual({});
    expect(snap.courseLevels["sample-a"]).toBeUndefined();
  });

  it("soft-deletes a course, hides it, and purges it after 30 days", () => {
    const t0 = new Date("2026-10-01T00:00:00Z");
    applyChange(db, { type: "upsertCourse", course: course() });
    applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: [level("l1", ["a"])] });
    applyChange(db, { type: "deleteCourse", courseId: "custom-1" }, () => t0);
    expect(loadLibrary(db).createdCourses).toEqual([]);
    expect(purgeTrash(db, () => new Date("2026-10-20T00:00:00Z"))).toBe(0);
    expect(db.prepare("SELECT COUNT(*) AS n FROM courses").get()).toEqual({ n: 1 });
    expect(purgeTrash(db, () => new Date("2026-11-05T00:00:00Z"))).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS n FROM courses").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT COUNT(*) AS n FROM levels").get()).toEqual({ n: 0 });
  });

  it("treats a repeated word id within a level as one word", () => {
    applyChange(db, { type: "upsertCourse", course: course() });
    const bad = [level("l1", ["a"]), { ...level("l2", ["b"]), words: [{ ...level("l2", ["b"]).words[0]!, learned: true }, { ...level("l2", ["b"]).words[0]! }] }];
    // Duplicate word id inside one level violates the primary key.
    expect(() => applyChange(db, { type: "saveLevels", courseId: "custom-1", levels: bad })).not.toThrow();
    // Word ids repeated across saves are upserts, so the stored level has a single such word.
    expect(db.prepare("SELECT COUNT(*) AS n FROM words WHERE level_id = 'l2'").get()).toEqual({ n: 1 });
  });
});

describe("change validation", () => {
  it("enforces the course limits", () => {
    const parse = (c: Partial<CourseData>) => LibraryChangeSchema.safeParse({ type: "upsertCourse", course: { ...course(), ...c } }).success;
    expect(parse({})).toBe(true);
    expect(parse({ title: "ab" })).toBe(false);
    expect(parse({ title: "x".repeat(101) })).toBe(false);
    expect(parse({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) })).toBe(false);
    expect(parse({ description: "x".repeat(2001) })).toBe(false);
    expect(parse({ shortDescription: "x".repeat(101) })).toBe(false);
  });

  it("rejects bad goals, unknown change types and too many images", () => {
    expect(LibraryChangeSchema.safeParse({ type: "setGoal", courseId: "a", value: 7 }).success).toBe(false);
    expect(LibraryChangeSchema.safeParse({ type: "dropEverything" }).success).toBe(false);
    const word = { id: "w", text: "t", meaning: "", example: "", learned: false, audio: [], images: Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, name: "a", type: "image/png", size: 1 })) };
    expect(LibraryChangeSchema.safeParse({ type: "saveLevels", courseId: "a", levels: [{ id: "l", name: "n", tested: "t", words: [word] }] }).success).toBe(false);
  });
});
