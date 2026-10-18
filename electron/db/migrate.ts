import type Database from "better-sqlite3";

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export class LibraryTooNewError extends Error {
  constructor(
    readonly found: number,
    readonly supported: number,
  ) {
    super(
      `This library was created by a newer version of MemBetter (format ${found}, this app supports ${supported}). Update the app.`,
    );
    this.name = "LibraryTooNewError";
  }
}

/** Parses `0001_name.sql` style entries from an import.meta.glob result. */
export function loadMigrations(files: Record<string, string>): Migration[] {
  return Object.entries(files)
    .map(([path, sql]) => {
      const match = /(\d+)_([^/]+)\.sql$/.exec(path);
      if (!match) throw new Error(`Bad migration file name: ${path}`);
      return { version: Number(match[1]), name: match[2], sql };
    })
    .sort((a, b) => a.version - b.version);
}

export function latestVersion(migrations: Migration[]): number {
  return migrations.at(-1)?.version ?? 0;
}

export function currentVersion(db: Database.Database): number {
  return db.pragma("user_version", { simple: true }) as number;
}

/**
 * Applies pending migrations, each in its own transaction.
 * `beforeUpgrade` runs once, only when there is something to apply to a non-empty library,
 * so the caller can keep a copy of the previous file.
 */
export function migrate(
  db: Database.Database,
  migrations: Migration[],
  beforeUpgrade?: (fromVersion: number) => void,
): number {
  const current = currentVersion(db);
  const latest = latestVersion(migrations);
  if (current > latest) throw new LibraryTooNewError(current, latest);

  const pending = migrations.filter((m) => m.version > current);
  if (pending.length === 0) return current;
  if (current > 0) beforeUpgrade?.(current);

  for (const m of pending) {
    db.transaction(() => {
      db.exec(m.sql);
      db.pragma(`user_version = ${m.version}`);
    })();
  }
  return latest;
}
