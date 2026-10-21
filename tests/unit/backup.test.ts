import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { BackupError, Backups, restoreBackup } from "../../electron/services/backup";
import { applyChange, loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import { Secrets } from "../../electron/services/secrets";
import { Settings } from "../../electron/services/settings";

const png = (seed: number) => {
  const b = new Uint8Array(80);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  b[30] = seed;
  return b;
};

let root: string;
let libDir: string;
let dest: string;
let clock: Date;
let handle: ReturnType<typeof openLibrary>;
let settings: Settings;
let media: MediaStore;
let backups: Backups;

const course = (id: string, title: string) => ({ id, title, categoryId: "lang-en-gb", teaching: true, totalItems: 0, itemsLearned: 0, itemsDue: 0, learnedToday: 0 });
const addCourse = (id: string, title: string, mediaId?: string) => {
  applyChange(handle.db, { type: "upsertCourse", course: course(id, title) });
  if (mediaId) {
    applyChange(handle.db, {
      type: "saveLevels",
      courseId: id,
      levels: [{ id: `l-${id}`, name: "L", tested: "t", words: [{ id: `w-${id}`, text: "word", meaning: "", example: "", images: [{ id: mediaId, name: "a.png", type: "image/png", size: 80 }], audio: [], learned: false }] }],
    });
  }
};

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "membetter-bk-"));
  libDir = join(root, "library");
  dest = join(root, "backups");
  clock = new Date(2026, 9, 19, 10, 0, 0);
  handle = openLibrary(join(libDir, "membetter.db"));
  settings = new Settings(handle.db);
  media = new MediaStore(handle.db, join(libDir, "media"));
  backups = new Backups(handle.db, settings, join(libDir, "media"), dest, () => clock);
});
afterEach(() => {
  try {
    handle.db.close();
  } catch {
    /* already closed by a restore */
  }
  rmSync(root, { recursive: true, force: true });
});

const tick = (minutes: number) => {
  clock = new Date(clock.getTime() + minutes * 60_000);
};

describe("creating backups", () => {
  it("takes a consistent copy with media, and the copy opens as a normal library", async () => {
    media.put("m1", png(1), "a.png");
    addCourse("c1", "First course", "m1");
    const entry = await backups.create();
    expect(entry.id).toMatch(/^membetter-20261019-100000\.db$/);
    expect(readdirSync(join(dest, "media"))).toHaveLength(1);

    const copy = new Database(join(dest, entry.id), { readonly: true });
    expect(copy.prepare("SELECT title FROM courses").all()).toEqual([{ title: "First course" }]);
    expect(copy.pragma("integrity_check", { simple: true })).toBe("ok");
    copy.close();
    expect(backups.config().lastAt).not.toBeNull();
    expect(readdirSync(dest).filter((n) => n.endsWith(".tmp"))).toEqual([]);
  });

  it("never contains AI keys, not even in the raw bytes", async () => {
    const KEY = "AIzaSy-backup-secret-0001";
    const secrets = new Secrets(settings, {
      available: () => true,
      weak: () => false,
      encrypt: (p) => new TextEncoder().encode(`enc:${p}`),
      decrypt: (d) => new TextDecoder().decode(d).slice(4),
    });
    secrets.save("google", KEY);
    secrets.save("nanoBanana", "nanoBanana-secret-0002");
    settings.set("ai.textModel", "my-model");
    const stored = settings.get("ai.googleKey.enc")!;
    const entry = await backups.create();
    const raw = readFileSync(join(dest, entry.id));
    expect(raw.includes(Buffer.from(KEY))).toBe(false);
    expect(raw.includes(Buffer.from(stored))).toBe(false);
    const copy = new Database(join(dest, entry.id), { readonly: true });
    const keys = (copy.prepare("SELECT key FROM settings ORDER BY key").all() as { key: string }[]).map((r) => r.key);
    expect(keys.some((k) => /ai\..*Key\./.test(k))).toBe(false);
    expect(keys).toContain("ai.textModel"); // other settings are kept
    copy.close();
  });

  it("copies only new media the next time, and keeps working while the app writes", async () => {
    media.put("m1", png(1), "a.png");
    addCourse("c1", "One", "m1");
    await backups.create();
    tick(60);
    media.put("m2", png(2), "b.png");
    addCourse("c2", "Two", "m2");
    const second = backups.create();
    addCourse("c3", "Written during the backup"); // concurrent write must not corrupt the copy
    await second;
    expect(readdirSync(join(dest, "media"))).toHaveLength(2);
    expect(backups.list()).toHaveLength(2);
  });

  it("keeps only the newest backups and removes media nobody refers to any more", async () => {
    backups.setConfig({ keep: 2 });
    media.put("old", png(1), "old.png");
    addCourse("c1", "One", "old");
    await backups.create();
    tick(60);
    applyChange(handle.db, { type: "saveLevels", courseId: "c1", levels: [] });
    media.collectGarbage();
    media.put("new", png(2), "new.png");
    addCourse("c2", "Two", "new");
    await backups.create();
    tick(60);
    await backups.create();
    tick(60);
    await backups.create();
    const list = backups.list();
    expect(list).toHaveLength(2);
    expect(list[0]!.id > list[1]!.id).toBe(true);
    expect(readdirSync(join(dest, "media"))).toHaveLength(1); // only "new" is still referenced
  });

  it("reports a folder that cannot be written as a remembered warning, without throwing from the schedule", async () => {
    writeFileSync(join(root, "not-a-folder"), "x");
    backups.setConfig({ folder: join(root, "not-a-folder", "inside") });
    await expect(backups.create()).rejects.toBeInstanceOf(BackupError);
    expect(backups.config().lastError).toMatch(/could not be written/);
    expect(await backups.runIfDue()).toBeNull();
    // A later success clears the warning.
    backups.setConfig({ folder: dest });
    await backups.create();
    expect(backups.config().lastError).toBeNull();
  });
});

describe("schedule", () => {
  it("is due when never backed up, then after the interval, and never when switched off", async () => {
    expect(backups.isDue()).toBe(true);
    expect(await backups.runIfDue()).not.toBeNull();
    expect(backups.isDue()).toBe(false);
    expect(await backups.runIfDue()).toBeNull();
    tick(24 * 60 + 1);
    expect(backups.isDue()).toBe(true);
    backups.setConfig({ intervalDays: 7 });
    expect(backups.isDue()).toBe(false);
    tick(7 * 24 * 60);
    expect(backups.isDue()).toBe(true);
    backups.setConfig({ enabled: false });
    expect(backups.isDue()).toBe(false);
  });

  it("has sensible defaults and a user-chosen folder", () => {
    expect(backups.config()).toMatchObject({ enabled: true, intervalDays: 1, keep: 10, folder: dest });
    expect(backups.setConfig({ folder: join(root, "elsewhere"), keep: 3 })).toMatchObject({ folder: join(root, "elsewhere"), keep: 3 });
  });
});

describe("restoring", () => {
  const restore = (id: string) =>
    restoreBackup({
      backups,
      id,
      libraryDir: libDir,
      mediaDir: join(libDir, "media"),
      currentSettingsRows: handle.db.prepare("SELECT key, value FROM settings WHERE key LIKE 'ai.%Key.%'").all() as { key: string; value: string }[],
      closeDb: () => handle.db.close(),
      now: () => clock,
    });
  const reopen = () => openLibrary(join(libDir, "membetter.db"));

  it("returns the library to the backed-up state, keeps the current keys, and saves the previous library", async () => {
    media.put("m1", png(1), "a.png");
    addCourse("c1", "Before", "m1");
    const entry = await backups.create();

    tick(60);
    addCourse("c2", "After the backup");
    applyChange(handle.db, { type: "deleteCourse", courseId: "c1" });
    rmSync(join(libDir, "media"), { recursive: true, force: true }); // media lost too
    settings.set("ai.googleKey.enc", "current-key-ciphertext");

    const { safetyCopy } = restore(entry.id);
    expect(existsSync(join(libDir, "pre-restore", safetyCopy))).toBe(true);

    const restored = reopen();
    expect(loadLibrary(restored.db).createdCourses.map((c) => c.title)).toEqual(["Before"]);
    expect(new Settings(restored.db).get("ai.googleKey.enc")).toBe("current-key-ciphertext");
    expect(new MediaStore(restored.db, join(libDir, "media")).resolve("m1")).not.toBeNull();
    restored.db.close();

    const previous = new Database(join(libDir, "pre-restore", safetyCopy), { readonly: true });
    expect(previous.prepare("SELECT title FROM courses WHERE deleted_at IS NULL").all()).toEqual([{ title: "After the backup" }]);
    previous.close();
    handle = reopen(); // so afterEach can close it
  });

  it("refuses a damaged backup, a newer-version backup, a missing one and one without its media, changing nothing", async () => {
    media.put("m1", png(1), "a.png");
    addCourse("c1", "Keep me", "m1");
    const good = await backups.create();

    writeFileSync(join(dest, "membetter-20200101-000000.db"), "this is not a database at all, just text");
    expect(() => restore("membetter-20200101-000000.db")).toThrow(/damaged/);

    const newer = new Database(join(dest, "membetter-20210101-000000.db"));
    newer.pragma("user_version = 999");
    newer.close();
    expect(() => restore("membetter-20210101-000000.db")).toThrow(/newer version/);

    expect(() => restore("membetter-20990101-000000.db")).toThrow(/could not be found/);
    expect(() => restore("../../etc/passwd")).toThrow(/does not exist/);

    for (const f of readdirSync(join(dest, "media"))) rmSync(join(dest, "media", f));
    expect(() => restore(good.id)).toThrow(/missing from the backup folder/);

    // The live library is untouched and still open.
    expect(loadLibrary(handle.db).createdCourses.map((c) => c.title)).toEqual(["Keep me"]);
    expect(existsSync(join(libDir, "pre-restore"))).toBe(false);
    expect(existsSync(join(libDir, "membetter.restore.db"))).toBe(false);
  });

  it("lists backups newest first and ignores other files", async () => {
    await backups.create();
    tick(60);
    await backups.create();
    writeFileSync(join(dest, "notes.txt"), "hi");
    mkdirSync(join(dest, "other"));
    const list = backups.list();
    expect(list.map((e) => e.id)).toEqual(["membetter-20261019-110000.db", "membetter-20261019-100000.db"]);
    expect(list.every((e) => e.sizeBytes > 0)).toBe(true);
    chmodSync(dest, 0o755);
  });
});
