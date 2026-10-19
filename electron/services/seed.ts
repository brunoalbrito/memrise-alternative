import type Database from "better-sqlite3";
import { importArchive, readArchive } from "./exchange";
import { loadLibrary } from "./library";
import type { MediaStore } from "./media";

/** Loads a library file into a library that has no courses yet. Returns whether it did. Used only for the sample data folder. */
export function seedIfEmpty(db: Database.Database, media: MediaStore, file: string): boolean {
  const snapshot = loadLibrary(db);
  if (snapshot.createdCourses.length > 0 || snapshot.removedCourseIds.length > 0) return false;
  importArchive(db, media, readArchive(file), "replace");
  return true;
}
