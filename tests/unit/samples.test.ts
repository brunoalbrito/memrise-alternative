import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { importArchive, previewOf, readArchive } from "../../electron/services/exchange";
import { loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import { buildSampleLibrary } from "../../scripts/make-sample-library";
import { sampleCourses } from "../../scripts/sample-data";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("sample library (development data)", () => {
  it("is a valid library file that imports cleanly and repeats without duplicating", () => {
    const dir = mkdtempSync(join(tmpdir(), "membetter-samples-"));
    dirs.push(dir);
    const file = join(dir, "sample-courses.membetter");
    writeFileSync(file, buildSampleLibrary());

    const { db } = openLibrary(join(dir, "membetter.db"));
    const media = new MediaStore(db, join(dir, "media"));
    const preview = previewOf(db, readArchive(file), "t");
    expect(preview.courses).toHaveLength(sampleCourses.length);
    expect(preview.courses.every((c) => c.words > 0 && !c.conflict)).toBe(true);

    importArchive(db, media, readArchive(file), "replace");
    importArchive(db, media, readArchive(file), "replace");
    const snap = loadLibrary(db);
    expect(snap.createdCourses.map((c) => c.id).sort()).toEqual(sampleCourses.map((c) => c.id).sort());
    expect(snap.createdCourses.every((c) => c.title.length >= 3 && c.title.length <= 100)).toBe(true);
    // No invented progress.
    expect(snap.createdCourses.every((c) => c.itemsLearned === 0 && c.itemsDue === 0)).toBe(true);
    db.close();
  });
});
