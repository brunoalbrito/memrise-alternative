import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { importArchive, previewOf, readArchive } from "../../electron/services/exchange";
import { loadLibrary } from "../../electron/services/library";
import { MediaStore, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, sniff } from "../../electron/services/media";
import { buildSampleLibrary } from "../../scripts/make-sample-library";
import { sampleCourses } from "../../scripts/sample-data";
import { makePng, makeWav } from "../../scripts/sample-media";

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

  it("has pictures and recordings, enough for every choice exercise, and they are valid media", () => {
    const words = sampleCourses.flatMap((c) => c.levels.flatMap((l) => l.words));
    expect(words.filter((w) => w.image).length).toBeGreaterThanOrEqual(4);
    expect(words.filter((w) => w.audio).length).toBeGreaterThanOrEqual(4);
    const both = sampleCourses.find((c) => c.levels.flatMap((l) => l.words).filter((w) => w.image && w.audio).length >= 8);
    expect(both).toBeDefined();

    const archive = readArchive(writeSample());
    expect(archive.missingMedia).toBe(0);
    expect(archive.media.size).toBeGreaterThan(0);
    for (const { bytes, ext } of archive.media.values()) {
      const found = sniff(bytes);
      expect(found?.ext).toBe(ext);
      expect(bytes.length).toBeLessThan(found?.kind === "images" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES);
    }
  });

  it("makes a different picture and recording for every word, and the same ones every time", () => {
    expect(makePng("cat")).toEqual(makePng("cat"));
    expect(makePng("cat")).not.toEqual(makePng("dog"));
    expect(makeWav("cat")).toEqual(makeWav("cat"));
    expect(makeWav("cat")).not.toEqual(makeWav("dog"));
    expect(sniff(makePng("cat"))?.ext).toBe("png");
    expect(sniff(makeWav("cat"))?.ext).toBe("wav");
  });

  it("imports the media into the library and does not store it twice", () => {
    const dir = mkdtempSync(join(tmpdir(), "membetter-samples-"));
    dirs.push(dir);
    const { db } = openLibrary(join(dir, "membetter.db"));
    const media = new MediaStore(db, join(dir, "media"));
    importArchive(db, media, readArchive(writeSample()), "replace");
    importArchive(db, media, readArchive(writeSample()), "replace");
    const course = loadLibrary(db).courseLevels["custom-sample-pictures-and-sounds"] ?? [];
    const words = course.flatMap((l) => l.words);
    expect(words).toHaveLength(12);
    expect(words.every((w) => w.images.length === 1 && w.audio.length === 1)).toBe(true);
    expect(words.every((w) => media.resolve(w.images[0]!.id) && media.resolve(w.audio[0]!.id))).toBe(true);
    db.close();
  });
});

function writeSample(): string {
  const dir = mkdtempSync(join(tmpdir(), "membetter-samples-"));
  dirs.push(dir);
  const file = join(dir, "sample-courses.membetter");
  writeFileSync(file, buildSampleLibrary());
  return file;
}
