import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addedSince, assertTemporary, listTree, protectedFolders, snapshot } from "../e2e/guard";

const dirs: string[] = [];
const temp = () => {
  const d = mkdtempSync(join(tmpdir(), "membetter-guard-"));
  dirs.push(d);
  return d;
};
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("end-to-end data guard", () => {
  it("watches the library of the installed and the development app and the real backups folder", () => {
    const names = protectedFolders().join("\n").toLowerCase();
    expect(names).toContain("membetter");
    expect(names).toContain("membetter-dev");
    expect(names).toContain("membetter backups");
  });

  it("reports what was added to a protected folder, and a folder that appeared", () => {
    const root = temp();
    const lib = join(root, "library");
    mkdirSync(join(lib, "media"), { recursive: true });
    writeFileSync(join(lib, "membetter.db"), "x");
    const before = snapshot([lib, join(root, "later")]);
    expect(addedSince(before, snapshot([lib, join(root, "later")]))).toEqual([]);

    writeFileSync(join(lib, "media", "a.png"), "x");
    mkdirSync(join(root, "later"));
    expect(addedSince(before, snapshot([lib, join(root, "later")]))).toEqual([join(lib, "media", "a.png"), `${join(root, "later")} (the folder itself)`]);
  });

  it("does not mind files that disappear", () => {
    const root = temp();
    writeFileSync(join(root, "a"), "x");
    const before = snapshot([root]);
    rmSync(join(root, "a"));
    expect(addedSince(before, snapshot([root]))).toEqual([]);
    expect(listTree(join(root, "missing"))).toBeNull();
  });

  it("only lets a test app use a temporary data folder", () => {
    expect(() => assertTemporary(temp())).not.toThrow();
    expect(() => assertTemporary(join(tmpdir(), "membetter-new-folder"))).not.toThrow();
    expect(() => assertTemporary(join(process.env["HOME"] ?? "/Users/x", "Library", "Application Support", "MemBetter"))).toThrow(/temporary/);
    expect(() => assertTemporary("/")).toThrow(/temporary/);
  });
});
