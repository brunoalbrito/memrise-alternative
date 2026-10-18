import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary, migrations } from "../../electron/db/connection";
import { LibraryTooNewError, loadMigrations, migrate } from "../../electron/db/migrate";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-test-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("migrations", () => {
  it("loads bundled migrations in order", () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(migrations.map((m) => m.version)).toEqual([...migrations.map((m) => m.version)].sort((a, b) => a - b));
  });

  it("creates a fresh library at the latest version without a pre-upgrade copy", () => {
    const { db, version } = openLibrary(join(dir, "lib", "membetter.db"));
    expect(version).toBe(migrations.at(-1)!.version);
    expect(db.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.pragma("foreign_keys", { simple: true })).toBe(1);
    expect(() => db.prepare("SELECT key, value FROM settings").all()).not.toThrow();
    db.close();
    expect(existsSync(join(dir, "lib", "pre-upgrade"))).toBe(false);
  });

  it("is idempotent when reopened", () => {
    const path = join(dir, "membetter.db");
    openLibrary(path).db.close();
    const again = openLibrary(path);
    expect(again.version).toBe(migrations.at(-1)!.version);
    again.db.close();
  });

  it("keeps a copy of the previous library and applies new migrations", () => {
    const path = join(dir, "membetter.db");
    const v1 = loadMigrations({ "./0001_a.sql": "CREATE TABLE a (id INTEGER PRIMARY KEY) STRICT;" });
    const first = openLibrary(path, { migrations: v1 });
    first.db.prepare("INSERT INTO a (id) VALUES (1)").run();
    first.db.close();

    const v2 = loadMigrations({
      "./0001_a.sql": "CREATE TABLE a (id INTEGER PRIMARY KEY) STRICT;",
      "./0002_b.sql": "CREATE TABLE b (id INTEGER PRIMARY KEY) STRICT;",
    });
    const second = openLibrary(path, { migrations: v2 });
    expect(second.version).toBe(2);
    expect(second.db.prepare("SELECT COUNT(*) AS n FROM a").get()).toEqual({ n: 1 });
    second.db.close();

    const copies = readdirSync(join(dir, "pre-upgrade"));
    expect(copies).toHaveLength(1);
    const copy = new Database(join(dir, "pre-upgrade", copies[0]!), { readonly: true });
    expect(copy.pragma("user_version", { simple: true })).toBe(1);
    expect(copy.prepare("SELECT COUNT(*) AS n FROM a").get()).toEqual({ n: 1 });
    copy.close();
  });

  it("refuses a library from a newer version and leaves it untouched", () => {
    const path = join(dir, "membetter.db");
    const db = new Database(path);
    db.pragma("user_version = 999");
    db.close();
    expect(() => openLibrary(path)).toThrow(LibraryTooNewError);
    const check = new Database(path);
    expect(check.pragma("user_version", { simple: true })).toBe(999);
    check.close();
  });

  it("rolls back a failing migration", () => {
    const db = new Database(":memory:");
    const bad = loadMigrations({
      "./0001_ok.sql": "CREATE TABLE ok (id INTEGER) STRICT;",
      "./0002_bad.sql": "CREATE TABLE half (id INTEGER) STRICT; THIS IS NOT SQL;",
    });
    expect(() => migrate(db, bad)).toThrow();
    expect(db.pragma("user_version", { simple: true })).toBe(1);
    expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'half'").get()).toBeUndefined();
    db.close();
  });
});
