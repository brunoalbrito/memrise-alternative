import { createHash, randomUUID } from "node:crypto";
import { createWriteStream, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { once } from "node:events";
import { basename } from "node:path";
import type Database from "better-sqlite3";
import { strFromU8, strToU8, unzipSync, Zip, ZipDeflate, ZipPassThrough } from "fflate";
import { z } from "zod";
import { applyChange } from "./library";
import { MediaError, MediaStore, sniff, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES } from "./media";
import {
  CourseSchema,
  type CourseData,
  type CourseLevelData,
  type ExportItem,
  type ImportChoice,
  type ImportPreview,
  MediaRefSchema,
} from "../shared/schemas";

type Db = Database.Database;

export const FORMAT = "membetter-course";
export const FORMAT_VERSION = 1;
export const LIMITS = { entries: 10_000, entryBytes: 50 * 1024 * 1024, totalBytes: 2 * 1024 ** 3, ratio: 100 };

export class ExchangeError extends Error {
  constructor(
    readonly code: "unsupported_format" | "integrity_failed" | "validation_failed" | "limit_exceeded",
    message: string,
  ) {
    super(message);
    this.name = "ExchangeError";
  }
}

// ---- File schemas -------------------------------------------------------------------------------------------

const HASH = /^[0-9a-f]{64}$/;
const ManifestSchema = z.object({
  format: z.literal(FORMAT),
  formatVersion: z.number().int().min(1),
  kind: z.enum(["course", "library"]),
  appVersion: z.string().max(50).optional(),
  exportedAt: z.string().max(50).optional(),
});

const FileMediaRef = MediaRefSchema.extend({ hash: z.string().regex(HASH) });
const FileWordSchema = z.object({
  id: z.string().max(100),
  text: z.string().max(500),
  meaning: z.string().max(5000),
  example: z.string().max(5000),
  ipa: z.string().max(500).optional(),
  images: z.array(FileMediaRef).max(5),
  audio: z.array(FileMediaRef).max(5),
});
const FileLevelSchema = z.object({
  id: z.string().max(100),
  name: z.string().max(200),
  tested: z.string().max(500),
  words: z.array(FileWordSchema).max(5000),
});
const FileCourseSchema = z.object({
  course: CourseSchema.omit({ totalItems: true, itemsLearned: true, itemsDue: true, learnedToday: true }),
  levels: z.array(FileLevelSchema).max(500),
});
type FileCourse = z.infer<typeof FileCourseSchema>;

// ---- Export -------------------------------------------------------------------------------------------------

export interface ExportResult {
  courses: number;
  missingMedia: number;
}

/** Writes a `.membetter` archive (one course, or several as a library) to `outPath`, atomically. */
export async function writeArchive(
  items: ExportItem[],
  media: MediaStore,
  outPath: string,
  onProgress: (done: number, total: number) => void = () => {},
  now: () => Date = () => new Date(),
): Promise<ExportResult> {
  const kind = items.length === 1 ? "course" : "library";
  const tmp = `${outPath}.${process.pid}.tmp`;
  const out = createWriteStream(tmp);
  let failure: Error | null = null;
  const zip = new Zip((error, chunk, final) => {
    if (error) failure = error;
    else out.write(chunk);
    if (final) out.end();
  });
  const addJson = (name: string, value: unknown) => {
    const file = new ZipDeflate(name, { level: 6 });
    zip.add(file);
    file.push(strToU8(JSON.stringify(value, null, 2)), true);
  };

  let missingMedia = 0;
  const written = new Set<string>();
  const fileCourses: FileCourse[] = [];
  const pending: { name: string; path: string }[] = [];

  for (const item of items) {
    const levels = item.levels.map((level) => ({
      id: level.id,
      name: level.name,
      tested: level.tested,
      words: level.words.map((word) => {
        const toRef = (ref: { id: string; name: string; type: string; size: number }) => {
          const file = media.resolve(ref.id);
          if (!file) {
            missingMedia += 1;
            return null;
          }
          const name = basename(file.path);
          const hash = name.slice(0, 64);
          if (!written.has(name)) {
            written.add(name);
            pending.push({ name: `media/${name}`, path: file.path });
          }
          return { ...ref, hash };
        };
        return {
          id: word.id,
          text: word.text,
          meaning: word.meaning,
          example: word.example,
          ...(word.ipa !== undefined ? { ipa: word.ipa } : {}),
          images: word.images.map(toRef).filter((r) => r !== null),
          audio: word.audio.map(toRef).filter((r) => r !== null),
        };
      }),
    }));
    // Counts and progress are not part of the course content.
    const course: FileCourse["course"] = { ...item.course };
    for (const key of ["totalItems", "itemsLearned", "itemsDue", "learnedToday"] as const) delete (course as Record<string, unknown>)[key];
    fileCourses.push({ course, levels });
  }

  try {
    addJson("manifest.json", {
      format: FORMAT,
      formatVersion: FORMAT_VERSION,
      kind,
      appVersion: process.env["npm_package_version"] ?? "1.0.0",
      exportedAt: now().toISOString(),
      counts: { courses: fileCourses.length, media: pending.length },
    });
    if (kind === "course") addJson("course.json", fileCourses[0]);
    else for (const fc of fileCourses) addJson(`courses/${fc.course.id}/course.json`, fc);

    let done = 0;
    for (const m of pending) {
      const file = new ZipPassThrough(m.name);
      zip.add(file);
      file.push(readFileSync(m.path), true);
      onProgress(++done, pending.length);
    }
    zip.end();
    await once(out, "close");
    if (failure) throw failure;
    renameSync(tmp, outPath);
  } catch (error) {
    out.destroy();
    rmSync(tmp, { force: true });
    throw error;
  }
  return { courses: fileCourses.length, missingMedia };
}

// ---- Import: read and validate ---------------------------------------------------------------------------------

export interface ParsedArchive {
  kind: "course" | "library";
  courses: FileCourse[];
  media: Map<string, { bytes: Uint8Array; ext: string }>;
  missingMedia: number;
}

const MEDIA_NAME = /^media\/([0-9a-f]{64})\.(png|jpg|gif|webp|wav|ogg|m4a|aac|mp3)$/;
const LIB_COURSE = /^courses\/[A-Za-z0-9_-]{1,100}\/course\.json$/;

function allowedName(name: string): boolean {
  return name === "manifest.json" || name === "course.json" || name === "progress.json" || MEDIA_NAME.test(name) || LIB_COURSE.test(name);
}

const parseJson = <T extends z.ZodType>(entry: Uint8Array | undefined, schema: T, label: string): z.infer<T> => {
  if (!entry) throw new ExchangeError("validation_failed", `The file is missing ${label}.`);
  let raw: unknown;
  try {
    raw = JSON.parse(strFromU8(entry));
  } catch {
    throw new ExchangeError("validation_failed", `${label} is not valid.`);
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ExchangeError("validation_failed", `${label} is not valid: ${result.error.issues[0]?.message ?? "unknown problem"}.`);
  return result.data;
};

/** Reads and fully validates an archive without touching the library. */
export function readArchive(path: string): ParsedArchive {
  let data: Uint8Array;
  try {
    if (statSync(path).size > LIMITS.totalBytes) throw new ExchangeError("limit_exceeded", "This file is too large to import.");
    data = readFileSync(path);
  } catch (error) {
    if (error instanceof ExchangeError) throw error;
    throw new ExchangeError("validation_failed", "The file could not be read.");
  }

  let entries = 0;
  let total = 0;
  const seen = new Set<string>();
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data, {
      filter: (file) => {
        if (++entries > LIMITS.entries) throw new ExchangeError("limit_exceeded", "The file has too many entries.");
        if (!allowedName(file.name) || seen.has(file.name)) throw new ExchangeError("validation_failed", "The file contains unexpected entries.");
        seen.add(file.name);
        total += file.originalSize;
        if (file.originalSize > LIMITS.entryBytes || total > LIMITS.totalBytes) throw new ExchangeError("limit_exceeded", "The file is too large to import.");
        if (file.size > 1024 && file.originalSize / file.size > LIMITS.ratio) throw new ExchangeError("limit_exceeded", "The file is not a valid MemBetter file.");
        return true;
      },
    });
  } catch (error) {
    if (error instanceof ExchangeError) throw error;
    throw new ExchangeError("validation_failed", "This is not a valid MemBetter file, or it is damaged.");
  }

  const manifest = parseJson(files["manifest.json"], ManifestSchema, "the manifest");
  if (manifest.formatVersion > FORMAT_VERSION) {
    throw new ExchangeError("unsupported_format", "This file was made by a newer version of MemBetter. Update the app to import it.");
  }

  const courses: FileCourse[] = [];
  if (manifest.kind === "course") courses.push(parseJson(files["course.json"], FileCourseSchema, "the course"));
  else {
    for (const name of Object.keys(files).filter((n) => LIB_COURSE.test(n)).sort()) {
      courses.push(parseJson(files[name], FileCourseSchema, "a course"));
    }
    if (courses.length === 0) throw new ExchangeError("validation_failed", "The library file has no courses.");
  }

  const media = new Map<string, { bytes: Uint8Array; ext: string }>();
  for (const [name, bytes] of Object.entries(files)) {
    const m = MEDIA_NAME.exec(name);
    if (!m) continue;
    const [, hash, ext] = m as unknown as [string, string, string];
    if (createHash("sha256").update(bytes).digest("hex") !== hash) throw new ExchangeError("integrity_failed", "A file inside the course is damaged.");
    const found = sniff(bytes);
    const limit = found?.kind === "images" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
    if (!found || found.ext !== ext || bytes.length > limit) throw new ExchangeError("integrity_failed", "A file inside the course has the wrong type or is too large.");
    media.set(hash, { bytes, ext });
  }

  let missingMedia = 0;
  for (const fc of courses) {
    for (const level of fc.levels) {
      for (const word of level.words) {
        for (const ref of [...word.images, ...word.audio]) if (!media.has(ref.hash)) missingMedia += 1;
      }
    }
  }
  return { kind: manifest.kind, courses, media, missingMedia };
}

// ---- Import: apply ------------------------------------------------------------------------------------------

/** Ids that come from built-in sample courses are kept deterministic so repeating an import replaces, not duplicates. */
export function targetId(fileId: string): string {
  return fileId.startsWith("custom-") || fileId.startsWith("imported-") ? fileId : `imported-${fileId}`;
}

function courseExists(db: Db, id: string): boolean {
  return db.prepare("SELECT 1 FROM courses WHERE id = ? AND deleted_at IS NULL").get(id) !== undefined;
}

export function previewOf(db: Db, parsed: ParsedArchive, token: string): ImportPreview {
  return {
    token,
    kind: parsed.kind,
    missingMedia: parsed.missingMedia,
    courses: parsed.courses.map((fc) => {
      const words = fc.levels.flatMap((l) => l.words);
      const hashes = new Set(words.flatMap((w) => [...w.images, ...w.audio].map((r) => r.hash)));
      return {
        title: fc.course.title,
        levels: fc.levels.length,
        words: words.filter((w) => w.text.trim() !== "").length,
        media: hashes.size,
        conflict: courseExists(db, targetId(fc.course.id)),
      };
    }),
  };
}

/** Imports every course in one transaction. On any failure the library is unchanged. */
export function importArchive(db: Db, media: MediaStore, parsed: ParsedArchive, choice: Exclude<ImportChoice, "cancel">): number {
  try {
    db.transaction(() => {
      for (const fc of parsed.courses) {
        const wanted = targetId(fc.course.id);
        const exists = courseExists(db, wanted);
        const copy = exists && choice === "copy";
        const id = copy ? `custom-${randomUUID()}` : wanted;
        const title = copy ? `${fc.course.title} (copy)`.slice(0, 100) : fc.course.title;

        const levels: CourseLevelData[] = fc.levels.map((level) => ({
          id: randomUUID(),
          name: level.name,
          tested: level.tested,
          words: level.words.map((word) => {
            const store = (ref: { hash: string; name: string; type: string; size: number }) => {
              const file = parsed.media.get(ref.hash);
              if (!file) return null;
              const newId = `media-${randomUUID()}`;
              media.put(newId, file.bytes, ref.name);
              return { id: newId, name: ref.name, type: ref.type, size: file.bytes.length };
            };
            return {
              id: randomUUID(),
              text: word.text,
              meaning: word.meaning,
              example: word.example,
              ...(word.ipa !== undefined ? { ipa: word.ipa } : {}),
              images: word.images.map(store).filter((r) => r !== null),
              audio: word.audio.map(store).filter((r) => r !== null),
              learned: false,
            };
          }),
        }));

        const course: CourseData = {
          ...fc.course,
          id,
          title,
          teaching: true,
          totalItems: levels.flatMap((l) => l.words).filter((w) => w.text.trim() !== "").length,
          itemsLearned: 0,
          itemsDue: 0,
          learnedToday: 0,
        };
        applyChange(db, { type: "upsertCourse", course });
        applyChange(db, { type: "saveLevels", courseId: id, levels });
      }
    })();
  } catch (error) {
    media.collectGarbage();
    if (error instanceof MediaError) throw new ExchangeError("integrity_failed", error.message);
    throw error;
  }
  media.collectGarbage();
  return parsed.courses.length;
}
