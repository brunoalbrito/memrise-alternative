import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createWriteStream, readFileSync, renameSync, rmSync, statSync } from "node:fs";
import { once } from "node:events";
import Database from "better-sqlite3";
import { Zip, ZipDeflate, ZipPassThrough, strToU8 } from "fflate";
import { z } from "zod";
import { applyChange } from "./library";
import type { MediaStore } from "./media";
import type { CourseLevelData, ExportItem } from "../shared/schemas";

type Db = Database.Database;

// ---- Anki export (.apkg) -------------------------------------------------------------------------------------

const FIELDS = ["Word", "Meaning", "Example", "IPA", "Image", "Audio"] as const;

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null,
  dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null,
  dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null,
  tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null,
  usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null,
  reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null,
  flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null,
  lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);`;

const BASE91 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~";
function guid(): string {
  let n = BigInt(`0x${randomBytes(8).toString("hex")}`);
  let out = "";
  do {
    out = BASE91[Number(n % 91n)] + out;
    n /= 91n;
  } while (n > 0n);
  return out;
}

const escapeHtml = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Anki's checksum of a note's sort field: the first 8 hex digits of the SHA-1 of the text without HTML. */
export function csum(text: string): number {
  return parseInt(createHash("sha1").update(text.replace(/<[^>]*>/g, "")).digest("hex").slice(0, 8), 16);
}

export interface ApkgMedia {
  /** Name inside the package, as referenced from fields (for example `sink.png`). */
  name: string;
  /** Path of the file on disk. */
  path: string;
}

export interface ApkgBuild {
  collection: Uint8Array;
  media: ApkgMedia[];
  notes: number;
}

/** The deck name for a level: `Course::Level` so Anki shows levels as sub-decks. */
const deckName = (course: string, level: string): string => `${course.replace(/::/g, ":")}::${level.replace(/::/g, ":")}`;

/** Builds an Anki collection (schema version 11, understood by every Anki version) for one course. */
export function buildCollection(item: ExportItem, media: MediaStore, now: Date = new Date()): ApkgBuild {
  const db: Db = new Database(":memory:");
  const seconds = Math.floor(now.getTime() / 1000);
  let nextId = now.getTime();
  const id = () => (nextId += 1);

  const modelId = id();
  const courseDeckId = id();
  const model = {
    [modelId]: {
      id: modelId,
      name: "MemBetter word",
      type: 0,
      mod: seconds,
      usn: -1,
      sortf: 0,
      did: courseDeckId,
      tmpls: [
        {
          name: "Type the word",
          ord: 0,
          qfmt: "{{Image}}<div>{{Meaning}}</div>{{type:Word}}",
          afmt: "{{FrontSide}}<hr id=answer>{{Word}} <small>{{IPA}}</small><br>{{Example}}<br>{{Audio}}",
          bqfmt: "",
          bafmt: "",
          did: null,
          bfont: "",
          bsize: 0,
        },
      ],
      flds: FIELDS.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: "Arial", size: 20, media: [] })),
      css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; } img { max-width: 100%; }",
      latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
      latexPost: "\\end{document}",
      latexsvg: false,
      req: [[0, "any", [0, 1, 4]]],
      tags: [],
      vers: [],
    },
  };
  const deck = (deckId: number, name: string) => ({
    id: deckId,
    name,
    mod: seconds,
    usn: -1,
    lrnToday: [0, 0],
    revToday: [0, 0],
    newToday: [0, 0],
    timeToday: [0, 0],
    collapsed: false,
    browserCollapsed: false,
    desc: "",
    dyn: 0,
    conf: 1,
    extendNew: 0,
    extendRev: 0,
  });
  const decks: Record<string, unknown> = {
    "1": { ...deck(1, "Default"), desc: "" },
    [courseDeckId]: deck(courseDeckId, item.course.title.replace(/::/g, ":")),
  };
  const levelDeck = new Map<string, number>();
  for (const level of item.levels) {
    const deckId = id();
    levelDeck.set(level.id, deckId);
    decks[deckId] = deck(deckId, deckName(item.course.title, level.name || "Level"));
  }
  const dconf = {
    "1": {
      id: 1, mod: 0, name: "Default", usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true,
      new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20 },
      rev: { bury: true, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
      lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 },
      dyn: false,
    },
  };
  const conf = {
    activeDecks: [1], addToCur: true, collapseTime: 1200, curDeck: 1, curModel: String(modelId), dueCounts: true,
    estTimes: true, newBury: true, newSpread: 0, nextPos: 1, sortBackwards: false, sortType: "noteFld", timeLim: 0,
  };

  db.exec(SCHEMA);
  db.prepare("INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')").run(
    seconds, now.getTime(), now.getTime(), JSON.stringify(conf), JSON.stringify(model), JSON.stringify(decks), JSON.stringify(dconf),
  );

  const files = new Map<string, ApkgMedia>(); // by package name
  const addMedia = (ref: { id: string; name: string }): string | null => {
    const file = media.resolve(ref.id);
    if (!file) return null;
    const hash = file.path.split(/[\\/]/).pop()!.slice(0, 12);
    const ext = file.path.split(".").pop()!;
    const name = `membetter-${hash}.${ext}`;
    files.set(name, { name, path: file.path });
    return name;
  };

  const insertNote = db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')");
  const insertCard = db.prepare("INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')");
  let position = 0;
  let notes = 0;
  db.transaction(() => {
    for (const level of item.levels as CourseLevelData[]) {
      for (const word of level.words) {
        if (word.text.trim() === "") continue;
        const images = word.images.flatMap((r) => addMedia(r) ?? []).map((n) => `<img src="${n}">`).join("");
        const audio = word.audio.flatMap((r) => addMedia(r) ?? []).map((n) => `[sound:${n}]`).join("");
        const fields = [word.text, word.meaning, word.example, word.ipa ?? "", images, audio].map((f, i) => (i < 4 ? escapeHtml(f) : f));
        const noteId = id();
        insertNote.run(noteId, guid(), modelId, seconds, ` ${course(item)} `, fields.join("\x1f"), word.text, csum(escapeHtml(word.text)));
        insertCard.run(id(), noteId, levelDeck.get(level.id)!, seconds, (position += 1));
        notes += 1;
      }
    }
  })();

  const collection = new Uint8Array(db.serialize());
  db.close();
  return { collection, media: [...files.values()], notes };
}

const course = (item: ExportItem): string => item.course.id.replace(/\s/g, "_");

/** Writes a `.apkg` file (a zip with `collection.anki2`, a `media` index and the media files numbered from 0). */
export async function writeApkg(item: ExportItem, media: MediaStore, outPath: string, now: Date = new Date()): Promise<{ notes: number }> {
  const built = buildCollection(item, media, now);
  const tmp = `${outPath}.${process.pid}.tmp`;
  const out = createWriteStream(tmp);
  let failure: Error | null = null;
  const zip = new Zip((error, chunk, final) => {
    if (error) failure = error;
    else out.write(chunk);
    if (final) out.end();
  });
  try {
    const collection = new ZipDeflate("collection.anki2", { level: 6 });
    zip.add(collection);
    collection.push(built.collection, true);
    const index: Record<string, string> = {};
    built.media.forEach((m, i) => {
      index[String(i)] = m.name;
      const file = new ZipPassThrough(String(i));
      zip.add(file);
      file.push(readFileSync(m.path), true);
    });
    const mediaIndex = new ZipDeflate("media", { level: 6 });
    zip.add(mediaIndex);
    mediaIndex.push(strToU8(JSON.stringify(index)), true);
    zip.end();
    await once(out, "close");
    if (failure) throw failure;
    renameSync(tmp, outPath);
  } catch (error) {
    out.destroy();
    rmSync(tmp, { force: true });
    throw error;
  }
  return { notes: built.notes };
}

// ---- CSV import ------------------------------------------------------------------------------------------------

export const MAX_CSV_BYTES = 20 * 1024 * 1024;
export const MAX_CSV_ROWS = 50_000;

export type Delimiter = "," | ";" | "\t";

/** Splits text into rows of cells (RFC 4180: quoted cells may contain delimiters, quotes ("") and line breaks). */
export function parseCsv(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i]!;
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "") || row.length > 1) rows.push(row);
      row = [];
      if (rows.length > MAX_CSV_ROWS) throw new CsvError("This file has too many rows to import.");
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

/** Guesses the delimiter from the first lines: the one that gives the most consistent number of columns. */
export function detectDelimiter(text: string): Delimiter {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "").slice(0, 10);
  let best: Delimiter = ",";
  let bestScore = -1;
  for (const d of [",", ";", "\t"] as const) {
    const counts = lines.map((l) => l.split(d).length - 1);
    const first = counts[0] ?? 0;
    const score = first > 0 && counts.every((c) => c === first) ? first * 100 + lines.length : counts.reduce((a, b) => a + (b > 0 ? 1 : 0), 0);
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

export class CsvError extends Error {
  readonly code = "validation_failed";
  constructor(message: string) {
    super(message);
    this.name = "CsvError";
  }
}

export function readCsvFile(path: string): { rows: string[][]; delimiter: Delimiter } {
  let text: string;
  try {
    if (statSync(path).size > MAX_CSV_BYTES) throw new CsvError("This file is too large to import (maximum 20 MB).");
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (error instanceof CsvError) throw error;
    throw new CsvError("The file could not be read.");
  }
  if (text.includes("\u0000")) throw new CsvError("This does not look like a text or CSV file.");
  const delimiter = detectDelimiter(text);
  const rows = parseCsv(text, delimiter);
  if (rows.length === 0) throw new CsvError("The file has no rows.");
  return { rows, delimiter };
}

export interface CsvPreview {
  delimiter: Delimiter;
  columns: number;
  totalRows: number;
  /** The first rows, for the column mapping. */
  sample: string[][];
  /** The first row looks like column names. */
  looksLikeHeader: boolean;
}

export function previewCsv(path: string): CsvPreview {
  const { rows, delimiter } = readCsvFile(path);
  const columns = Math.max(...rows.slice(0, 50).map((r) => r.length));
  const first = rows[0]!.map((c) => c.trim().toLowerCase());
  const looksLikeHeader = first.some((c) => /^(word|term|front|meaning|definition|translation|back|example|ipa|palavra|significado)/.test(c));
  return { delimiter, columns, totalRows: rows.length, sample: rows.slice(0, 6), looksLikeHeader };
}

export const CsvImportSchema = z.object({
  path: z.string().min(1).max(4096),
  hasHeader: z.boolean(),
  /** 0-based column numbers; `word` is required. */
  mapping: z.object({
    word: z.number().int().min(0).max(100),
    meaning: z.number().int().min(0).max(100).nullable(),
    example: z.number().int().min(0).max(100).nullable(),
    ipa: z.number().int().min(0).max(100).nullable(),
  }),
  title: z.string().trim().min(3).max(100),
  teachingLanguageId: z.string().min(1).max(50),
  speakersLanguageId: z.string().min(1).max(50),
});
export type CsvImport = z.infer<typeof CsvImportSchema>;

export interface CsvResult {
  courseId: string;
  imported: number;
  skipped: { row: number; reason: string }[];
}

const WORDS_PER_LEVEL = 100;

/** Creates a new course from a word list. Rows that cannot be used are skipped and reported with the row number and the reason. */
export function importCsv(db: Db, input: CsvImport): CsvResult {
  const { rows } = readCsvFile(input.path);
  const skipped: CsvResult["skipped"] = [];
  const seen = new Map<string, number>();
  const words: CourseLevelData["words"] = [];
  const cell = (row: string[], column: number | null): string => (column === null ? "" : (row[column] ?? "").trim());

  rows.forEach((row, index) => {
    if (index === 0 && input.hasHeader) return;
    const number = index + 1;
    const text = cell(row, input.mapping.word);
    const meaning = cell(row, input.mapping.meaning);
    const example = cell(row, input.mapping.example);
    const ipa = cell(row, input.mapping.ipa).replace(/^\/+|\/+$/g, "");
    if (text === "") return void skipped.push({ row: number, reason: "The word is empty." });
    if (text.length > 500) return void skipped.push({ row: number, reason: "The word is longer than 500 characters." });
    if (meaning.length > 5000 || example.length > 5000) return void skipped.push({ row: number, reason: "The meaning or example is too long." });
    const key = text.toLowerCase();
    if (seen.has(key)) return void skipped.push({ row: number, reason: `The word is a repeat of row ${seen.get(key)}.` });
    seen.set(key, number);
    words.push({ id: randomUUID(), text, meaning, example, ...(ipa !== "" ? { ipa } : {}), images: [], audio: [], learned: false });
  });
  if (words.length === 0) throw new CsvError("No usable words were found. Check which column holds the words.");

  const levels: CourseLevelData[] = [];
  for (let i = 0; i < words.length; i += WORDS_PER_LEVEL) {
    levels.push({ id: randomUUID(), name: `Level ${levels.length + 1}`, tested: "Test on Word, prompt with Meaning.", words: words.slice(i, i + WORDS_PER_LEVEL) });
  }
  const courseId = `custom-${randomUUID()}`;
  db.transaction(() => {
    applyChange(db, {
      type: "upsertCourse",
      course: {
        id: courseId,
        title: input.title,
        categoryId: `lang-${input.teachingLanguageId}`,
        teaching: true,
        totalItems: words.length,
        itemsLearned: 0,
        itemsDue: 0,
        learnedToday: 0,
        teachingLanguageId: input.teachingLanguageId,
        speakersLanguageId: input.speakersLanguageId,
      },
    });
    applyChange(db, { type: "saveLevels", courseId, levels });
  })();
  return { courseId, imported: words.length, skipped };
}
