import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import Database from "better-sqlite3";
import { latestVersion } from "../db/migrate";
import { migrations } from "../db/connection";
import type { Settings } from "./settings";

type Db = Database.Database;

export const DEFAULTS = { enabled: true, intervalDays: 1, keep: 10 };
const FILE = /^membetter-(\d{8}-\d{6})\.db$/;
const SECRET_ROWS = "key LIKE 'ai.%Key.%'";

export interface BackupConfig {
  enabled: boolean;
  folder: string;
  intervalDays: number;
  keep: number;
  lastAt: string | null;
  /** Why the last automatic or manual backup failed, if it did. */
  lastError: string | null;
}

export interface BackupEntry {
  id: string;
  createdAt: string;
  sizeBytes: number;
}

export class BackupError extends Error {
  constructor(
    readonly code: "backup_failed" | "restore_refused" | "not_found",
    message: string,
  ) {
    super(message);
    this.name = "BackupError";
  }
}

const stamp = (d: Date): string => {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getFullYear(), 4)}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};
const parseStamp = (s: string): string => {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(s)!;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])).toISOString();
};

/**
 * Backups of the whole library: a consistent copy of the database (taken while the app is open) in
 * `<folder>/membetter-<time>.db`, plus the media files in a shared `<folder>/media` (only new files are copied).
 * AI keys are never written to a backup.
 */
export class Backups {
  constructor(
    private readonly db: Db,
    private readonly settings: Settings,
    private readonly mediaDir: string,
    private readonly defaultFolder: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  config(): BackupConfig {
    const num = (key: string, fallback: number) => {
      const value = Number(this.settings.get(key));
      return Number.isFinite(value) && value > 0 ? value : fallback;
    };
    return {
      enabled: (this.settings.get("backup.enabled") ?? (DEFAULTS.enabled ? "1" : "0")) === "1",
      folder: this.settings.get("backup.folder") ?? this.defaultFolder,
      intervalDays: num("backup.intervalDays", DEFAULTS.intervalDays),
      keep: num("backup.keep", DEFAULTS.keep),
      lastAt: this.settings.get("backup.lastAt"),
      lastError: this.settings.get("backup.lastError"),
    };
  }

  setConfig(patch: Partial<Pick<BackupConfig, "enabled" | "folder" | "intervalDays" | "keep">>): BackupConfig {
    if (patch.enabled !== undefined) this.settings.set("backup.enabled", patch.enabled ? "1" : "0");
    if (patch.folder !== undefined) this.settings.set("backup.folder", patch.folder);
    if (patch.intervalDays !== undefined) this.settings.set("backup.intervalDays", String(patch.intervalDays));
    if (patch.keep !== undefined) this.settings.set("backup.keep", String(patch.keep));
    return this.config();
  }

  /** Newest first. Only files that look like backups are listed. */
  list(folder = this.config().folder): BackupEntry[] {
    if (!existsSync(folder)) return [];
    return readdirSync(folder)
      .flatMap((name) => {
        const m = FILE.exec(name);
        if (!m) return [];
        return [{ id: name, createdAt: parseStamp(m[1]!), sizeBytes: statSync(join(folder, name)).size }];
      })
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  /** Makes a backup now. On failure the error is remembered (for a warning) and rethrown. */
  async create(): Promise<BackupEntry> {
    const config = this.config();
    try {
      const entry = await this.write(config);
      this.settings.set("backup.lastAt", this.now().toISOString());
      this.settings.delete("backup.lastError");
      return entry;
    } catch (error) {
      const message = error instanceof BackupError ? error.message : "The backup could not be written. Check that the folder exists and has free space.";
      this.settings.set("backup.lastError", message);
      throw error instanceof BackupError ? error : new BackupError("backup_failed", message);
    }
  }

  private async write(config: BackupConfig): Promise<BackupEntry> {
    mkdirSync(join(config.folder, "media"), { recursive: true });
    const name = `membetter-${stamp(this.now())}.db`;
    const final = join(config.folder, name);
    const tmp = `${final}.tmp`;
    try {
      // A consistent snapshot, even while the app is writing.
      await this.db.backup(tmp);
      this.removeSecrets(tmp);
      this.copyMedia(tmp, config.folder);
      renameSync(tmp, final);
    } catch (error) {
      rmSync(tmp, { force: true });
      throw error;
    }
    this.prune(config);
    return { id: name, createdAt: this.now().toISOString(), sizeBytes: statSync(final).size };
  }

  /** Keys never leave the library: they are removed from the copy and the free pages are wiped. */
  private removeSecrets(file: string): void {
    const copy = new Database(file);
    try {
      copy.pragma("secure_delete = ON");
      copy.prepare(`DELETE FROM settings WHERE ${SECRET_ROWS}`).run();
      copy.pragma("journal_mode = DELETE");
      copy.exec("VACUUM");
    } finally {
      copy.close();
    }
  }

  private copyMedia(backupDb: string, folder: string): void {
    const copy = new Database(backupDb, { readonly: true });
    try {
      for (const row of copy.prepare("SELECT hash, ext FROM media").all() as { hash: string; ext: string }[]) {
        const name = `${row.hash}.${row.ext}`;
        const target = join(folder, "media", name);
        const source = join(this.mediaDir, name);
        if (!existsSync(target) && existsSync(source)) copyFileSync(source, target);
      }
    } finally {
      copy.close();
    }
  }

  /** Keeps the newest `keep` backups and removes media no remaining backup refers to. */
  private prune(config: BackupConfig): void {
    const entries = this.list(config.folder);
    for (const old of entries.slice(config.keep)) rmSync(join(config.folder, old.id), { force: true });
    const keepList = entries.slice(0, config.keep);
    const used = new Set<string>();
    for (const entry of keepList) {
      const copy = new Database(join(config.folder, entry.id), { readonly: true });
      try {
        for (const row of copy.prepare("SELECT hash, ext FROM media").all() as { hash: string; ext: string }[]) used.add(`${row.hash}.${row.ext}`);
      } finally {
        copy.close();
      }
    }
    const mediaFolder = join(config.folder, "media");
    if (existsSync(mediaFolder)) for (const file of readdirSync(mediaFolder)) if (!used.has(file)) rmSync(join(mediaFolder, file), { force: true });
  }

  /** Whether an automatic backup is due now. */
  isDue(): boolean {
    const config = this.config();
    if (!config.enabled) return false;
    if (!config.lastAt) return true;
    return this.now().getTime() - new Date(config.lastAt).getTime() >= config.intervalDays * 86_400_000;
  }

  /** Runs an automatic backup if one is due. Failures are remembered, never thrown. */
  async runIfDue(): Promise<BackupEntry | null> {
    if (!this.isDue()) return null;
    try {
      return await this.create();
    } catch {
      return null;
    }
  }

  /**
   * Checks that a backup can be restored: it is a healthy database from this or an older version, and its media is present.
   * Throws a clear error otherwise, before anything is changed.
   */
  validate(id: string, folder = this.config().folder): { file: string; missingMedia: number } {
    if (!FILE.test(id)) throw new BackupError("not_found", "That backup does not exist.");
    const file = join(folder, id);
    if (!existsSync(file)) throw new BackupError("not_found", "That backup could not be found.");
    let copy: Db;
    try {
      copy = new Database(file, { readonly: true, fileMustExist: true });
    } catch {
      throw new BackupError("restore_refused", "This backup is damaged and cannot be restored.");
    }
    try {
      const check = (copy.pragma("integrity_check", { simple: true }) as string) ?? "";
      if (check !== "ok") throw new BackupError("restore_refused", "This backup is damaged and cannot be restored.");
      const version = copy.pragma("user_version", { simple: true }) as number;
      if (version > latestVersion(migrations)) {
        throw new BackupError("restore_refused", "This backup was made by a newer version of MemBetter. Update the app to restore it.");
      }
      if (version < 1) throw new BackupError("restore_refused", "This file is not a MemBetter backup.");
      let missing = 0;
      for (const row of copy.prepare("SELECT hash, ext FROM media").all() as { hash: string; ext: string }[]) {
        if (!existsSync(join(folder, "media", `${row.hash}.${row.ext}`))) missing += 1;
      }
      if (missing > 0) {
        throw new BackupError("restore_refused", `${missing} picture or audio ${missing === 1 ? "file is" : "files are"} missing from the backup folder, so it cannot be restored.`);
      }
      return { file, missingMedia: 0 };
    } catch (error) {
      if (error instanceof BackupError) throw error;
      throw new BackupError("restore_refused", "This backup is damaged and cannot be restored.");
    } finally {
      copy.close();
    }
  }
}

/**
 * Replaces the library with a backup. Everything is prepared first; the live database is only swapped at the end
 * and the previous library is kept in `pre-restore/`. The caller closes the live connection (`closeDb`) and restarts the app.
 */
export function restoreBackup(options: {
  backups: Backups;
  id: string;
  libraryDir: string;
  mediaDir: string;
  /** The keys currently saved on this computer are kept (backups never contain keys). */
  currentSettingsRows: { key: string; value: string }[];
  closeDb: () => void;
  now?: () => Date;
}): { safetyCopy: string } {
  const { backups, id, libraryDir, mediaDir, currentSettingsRows, closeDb } = options;
  const now = options.now ?? (() => new Date());
  const folder = backups.config().folder;
  const { file } = backups.validate(id, folder);

  const staged = join(libraryDir, "membetter.restore.db");
  rmSync(staged, { force: true });
  copyFileSync(file, staged);
  const restored = new Database(staged);
  try {
    restored.pragma("journal_mode = DELETE");
    const put = restored.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value");
    for (const row of currentSettingsRows) put.run(row.key, row.value);
    mkdirSync(mediaDir, { recursive: true });
    for (const row of restored.prepare("SELECT hash, ext FROM media").all() as { hash: string; ext: string }[]) {
      const name = `${row.hash}.${row.ext}`;
      const target = join(mediaDir, name);
      if (!existsSync(target)) copyFileSync(join(folder, "media", name), target);
    }
  } catch (error) {
    restored.close();
    rmSync(staged, { force: true });
    throw error;
  }
  restored.close();

  closeDb();
  const live = join(libraryDir, "membetter.db");
  const safetyDir = join(libraryDir, "pre-restore");
  mkdirSync(safetyDir, { recursive: true });
  const safetyCopy = join(safetyDir, `membetter-${stamp(now())}.db`);
  renameSync(live, safetyCopy);
  rmSync(`${live}-wal`, { force: true });
  rmSync(`${live}-shm`, { force: true });
  renameSync(staged, live);
  return { safetyCopy: basename(safetyCopy) };
}
