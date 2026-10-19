import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { dataProfile, SAMPLE_FOLDER } from "../../electron/main/profile";
import { openLibrary } from "../../electron/db/connection";
import { loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import { seedIfEmpty } from "../../electron/services/seed";
import { buildSampleLibrary } from "../../scripts/make-sample-library";

describe("data profile", () => {
  const env = { MEMBETTER_SEED_FILE: "/tmp/samples.membetter" };

  it("keeps the installed app on its own real folder and ignores any sample file", () => {
    const p = dataProfile({ isPackaged: true, argv: [], env });
    expect(p).toEqual({ kind: "real", folderName: null, seedFile: null, appDataDir: null, title: "MemBetter" });
  });

  it("keeps the installed app on the real folder even if a data folder is given on the command line", () => {
    expect(dataProfile({ isPackaged: true, argv: ["--user-data-dir=/x"], env }).folderName).toBeNull();
  });

  it("gives development its own folder, marked as sample data", () => {
    const p = dataProfile({ isPackaged: false, argv: [], env: {} });
    expect(p).toEqual({ kind: "sample", folderName: SAMPLE_FOLDER, seedFile: null, appDataDir: null, title: "MemBetter (sample data)" });
    expect(SAMPLE_FOLDER).not.toBe("MemBetter");
  });

  it("uses the sample file only outside the installed app", () => {
    expect(dataProfile({ isPackaged: false, argv: [], env }).seedFile).toBe("/tmp/samples.membetter");
    expect(dataProfile({ isPackaged: false, argv: [], env: { MEMBETTER_SEED_FILE: "" } }).seedFile).toBeNull();
  });

  it("moves the app-data folder only outside the installed app", () => {
    const withDir = { ...env, MEMBETTER_APP_DATA: "/tmp/appdata" };
    expect(dataProfile({ isPackaged: false, argv: [], env: withDir }).appDataDir).toBe("/tmp/appdata");
    expect(dataProfile({ isPackaged: true, argv: [], env: withDir }).appDataDir).toBeNull();
  });

  it("leaves a folder given with --user-data-dir alone (tests)", () => {
    const p = dataProfile({ isPackaged: false, argv: ["--user-data-dir=/tmp/t"], env: {} });
    expect(p).toMatchObject({ kind: "custom", folderName: null, title: "MemBetter" });
  });
});

describe("loading the sample course", () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  it("fills an empty library once and never changes a library that has courses", () => {
    const dir = mkdtempSync(join(tmpdir(), "membetter-seed-"));
    dirs.push(dir);
    const file = join(dir, "samples.membetter");
    writeFileSync(file, buildSampleLibrary());
    const { db } = openLibrary(join(dir, "membetter.db"));
    const media = new MediaStore(db, join(dir, "media"));

    expect(seedIfEmpty(db, media, file)).toBe(true);
    expect(loadLibrary(db).createdCourses).toHaveLength(1);
    expect(seedIfEmpty(db, media, file)).toBe(false);
    expect(loadLibrary(db).createdCourses).toHaveLength(1);
    db.close();
  });
});
