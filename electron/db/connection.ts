import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import { loadMigrations, migrate, type Migration } from "./migrate";

const files = import.meta.glob("./migrations/*.sql", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const migrations: Migration[] = loadMigrations(files);

export interface OpenedLibrary {
  db: Database.Database;
  version: number;
}

/** Opens (creating if needed) the library database and brings it to the latest format. */
export function openLibrary(
  dbPath: string,
  options: { migrations?: Migration[]; now?: () => Date } = {},
): OpenedLibrary {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  const now = options.now ?? (() => new Date());
  try {
    const version = migrate(db, options.migrations ?? migrations, (from) => {
      // Keep a copy of the library as it was before the upgrade.
      db.pragma("wal_checkpoint(TRUNCATE)");
      const stamp = now().toISOString().replace(/[:.]/g, "-");
      const dir = join(dirname(dbPath), "pre-upgrade");
      mkdirSync(dir, { recursive: true });
      copyFileSync(dbPath, join(dir, `membetter-v${from}-${stamp}.db`));
    });
    return { db, version };
  } catch (error) {
    db.close();
    throw error;
  }
}
