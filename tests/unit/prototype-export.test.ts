import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { importArchive, previewOf, readArchive } from "../../electron/services/exchange";
import { loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import { buildLegacyLibrary, type LegacyState } from "../../src/features/library/model/prototypeExport";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

const png = () => {
  const b = new Uint8Array(64);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new Blob([b], { type: "image/png" });
};

const legacy: LegacyState = {
  createdCourses: [
    {
      id: "custom-abc",
      title: "My old course",
      categoryId: "lang-en-gb",
      teaching: true,
      totalItems: 1,
      itemsLearned: 0,
      itemsDue: 0,
      learnedToday: 0,
      teachingLanguageId: "en-gb",
      speakersLanguageId: "pt-br",
    },
  ],
  courseEdits: { "english-visual-dictionary": { title: "My edited sample" } },
  courseLevels: {
    "custom-abc": [
      {
        id: "lv1",
        name: "Level 1",
        tested: "t",
        words: [{ id: "w1", text: "sink", meaning: "m", example: "", images: [{ id: "media-1", name: "sink.png", type: "image/png", size: 64 }, { id: "media-gone", name: "gone.png", type: "image/png", size: 64 }], audio: [], learned: true }],
      },
    ],
  },
};

describe("prototype export", () => {
  it("returns nothing when the prototype has no data", async () => {
    expect(await buildLegacyLibrary({})).toBeNull();
  });

  it("produces a file the desktop import accepts, once, even when imported twice", async () => {
    const bytes = await buildLegacyLibrary(legacy, async (id) => (id === "media-1" ? png() : undefined));
    expect(bytes).not.toBeNull();
    const dir = mkdtempSync(join(tmpdir(), "membetter-proto-"));
    dirs.push(dir);
    const file = join(dir, "membetter-library.membetter");
    writeFileSync(file, bytes!);

    const { db } = openLibrary(join(dir, "membetter.db"));
    const media = new MediaStore(db, join(dir, "media"));
    const parsed = readArchive(file);
    const preview = previewOf(db, parsed, "t");
    expect(preview.courses.map((c) => c.title).sort()).toEqual(["My edited sample", "My old course"]);
    importArchive(db, media, parsed, "replace");
    importArchive(db, media, readArchive(file), "replace");

    const snap = loadLibrary(db);
    expect(snap.createdCourses.map((c) => c.id).sort()).toEqual(["custom-abc", "imported-english-visual-dictionary"]);
    const words = snap.courseLevels["custom-abc"]![0]!.words;
    expect(words[0]!.images).toHaveLength(1); // the missing file is dropped, the present one kept
    expect(media.resolve(words[0]!.images[0]!.id)).not.toBeNull();
    db.close();
  });
});
