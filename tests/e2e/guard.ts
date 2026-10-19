import { existsSync, readdirSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";

/** Where Electron keeps per-user app data on this operating system. */
export function appDataDir(): string {
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support");
  if (process.platform === "win32") return process.env["APPDATA"] ?? join(homedir(), "AppData", "Roaming");
  return process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config");
}

/** The folders of the installed app and of the development app. Tests must never create or change anything inside them. */
export function protectedFolders(): string[] {
  const found = [join(appDataDir(), "MemBetter", "library"), join(appDataDir(), "MemBetter-dev", "library"), join(homedir(), "Documents", "MemBetter Backups")];
  // On a case-insensitive disk "membetter" and "MemBetter" are the same folder: list each real place once.
  return [...new Set(found.map((f) => (existsSync(f) ? realpathSync(f) : f)))];
}

/** Every file and folder name below `root` (relative paths), or null when `root` does not exist. */
export function listTree(root: string): string[] | null {
  if (!existsSync(root)) return null;
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      out.push(relative(root, path));
      if (entry.isDirectory()) walk(path);
    }
  };
  walk(root);
  return out.sort();
}

export type Snapshot = Record<string, string[] | null>;

export function snapshot(folders: string[] = protectedFolders()): Snapshot {
  return Object.fromEntries(folders.map((f) => [f, listTree(f)]));
}

/** What appeared in the protected folders since `before`. Files that disappear are not a problem here (the installed app cleans up after itself). */
export function addedSince(before: Snapshot, after: Snapshot): string[] {
  const added: string[] = [];
  for (const [folder, now] of Object.entries(after)) {
    const was = before[folder] ?? null;
    if (now === null) continue;
    if (was === null) added.push(`${folder} (the folder itself)`);
    else for (const name of now) if (!was.includes(name)) added.push(join(folder, name));
  }
  return added;
}

/** A data folder given to a test app must be a temporary one, never a real one. */
export function assertTemporary(folder: string): void {
  // A folder that does not exist yet is resolved through its nearest existing parent (/var is a link to /private/var on macOS).
  const real = (p: string): string => {
    const full = resolve(p);
    return existsSync(full) ? realpathSync(full) : join(real(dirname(full)), full.slice(dirname(full).length));
  };
  const temp = real(tmpdir());
  const target = real(folder);
  if (target !== temp && !target.startsWith(temp + sep)) throw new Error(`Refusing to run a test app on ${folder}: test data must live in the temporary folder.`);
}
