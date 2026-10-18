import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { strFromU8, unzipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openLibrary } from "../../electron/db/connection";
import { CsvError, csum, detectDelimiter, importCsv, parseCsv, previewCsv, writeApkg } from "../../electron/services/anki";
import { loadLibrary } from "../../electron/services/library";
import { MediaStore } from "../../electron/services/media";
import type { ExportItem } from "../../electron/shared/schemas";

let dir: string;
let db: Database.Database;
let media: MediaStore;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "membetter-anki-"));
  db = openLibrary(join(dir, "membetter.db")).db;
  media = new MediaStore(db, join(dir, "media"));
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const png = () => Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(60).fill(7)]);
const wav = () => Uint8Array.from([...new TextEncoder().encode("RIFF"), 0, 0, 0, 0, ...new TextEncoder().encode("WAVE"), ...new Array(60).fill(1)]);

function item(): ExportItem {
  media.put("img", png(), "sink.png");
  media.put("aud", wav(), "sink.wav");
  return {
    course: { id: "custom-1", title: "Kitchen: words", categoryId: "x", teaching: true, totalItems: 3, itemsLearned: 0, itemsDue: 0, learnedToday: 0 },
    levels: [
      {
        id: "l1",
        name: "First",
        tested: "t",
        words: [
          { id: "w1", text: "sink", meaning: "a bowl <b>for</b> washing", example: "I wash it & dry it.", ipa: "sɪŋk", images: [{ id: "img", name: "sink.png", type: "image/png", size: 68 }], audio: [{ id: "aud", name: "sink.wav", type: "audio/wav", size: 68 }], learned: false },
          { id: "w2", text: "  ", meaning: "empty word is skipped", example: "", images: [], audio: [], learned: false },
          { id: "w3", text: "wash", meaning: "clean", example: "", images: [], audio: [], learned: false },
        ],
      },
      { id: "l2", name: "Second", tested: "t", words: [{ id: "w4", text: "ladder", meaning: "steps", example: "", images: [], audio: [], learned: false }] },
    ],
  };
}

describe("Anki export", () => {
  it("writes a package Anki can read: collection, media index and numbered media files", async () => {
    const out = join(dir, "kitchen.apkg");
    const result = await writeApkg(item(), media, out, new Date("2026-10-19T10:00:00Z"));
    expect(result.notes).toBe(3);

    const files = unzipSync(readFileSync(out));
    expect(Object.keys(files).sort()).toEqual(["0", "1", "collection.anki2", "media"]);
    const index = JSON.parse(strFromU8(files["media"]!)) as Record<string, string>;
    expect(Object.keys(index).sort()).toEqual(["0", "1"]);
    expect(Object.values(index).sort().map((n) => n.split(".").pop())).toEqual(["png", "wav"]);
    const byName = Object.fromEntries(Object.entries(index).map(([k, v]) => [v, files[k]!]));
    expect([...Object.values(byName)].map((b) => b.length).sort()).toEqual([68, 72]);

    const dbFile = join(dir, "collection.anki2");
    writeFileSync(dbFile, files["collection.anki2"]!);
    const anki = new Database(dbFile, { readonly: true });
    expect(anki.pragma("integrity_check", { simple: true })).toBe("ok");

    const col = anki.prepare("SELECT * FROM col").get() as Record<string, string | number>;
    expect(col["ver"]).toBe(11);
    const models = JSON.parse(col["models"] as string) as Record<string, { name: string; flds: { name: string }[]; tmpls: { qfmt: string }[]; req: unknown[] }>;
    const model = Object.values(models)[0]!;
    expect(model.flds.map((f) => f.name)).toEqual(["Word", "Meaning", "Example", "IPA", "Image", "Audio"]);
    expect(model.tmpls[0]!.qfmt).toContain("{{type:Word}}");
    const decks = Object.values(JSON.parse(col["decks"] as string) as Record<string, { name: string }>).map((d) => d.name).sort();
    expect(decks).toEqual(["Default", "Kitchen: words", "Kitchen: words::First", "Kitchen: words::Second"]);

    const notes = anki.prepare("SELECT * FROM notes ORDER BY id").all() as { flds: string; sfld: string; csum: number; mid: number; guid: string; tags: string }[];
    expect(notes).toHaveLength(3);
    expect(notes.map((n) => n.sfld)).toEqual(["sink", "wash", "ladder"]);
    const fields = notes[0]!.flds.split("\x1f");
    expect(fields).toHaveLength(6);
    expect(fields.slice(0, 4)).toEqual(["sink", "a bowl &lt;b&gt;for&lt;/b&gt; washing", "I wash it &amp; dry it.", "sɪŋk"]);
    expect(fields[4]).toMatch(/^<img src="membetter-[0-9a-f]{12}\.png">$/);
    expect(fields[5]).toMatch(/^\[sound:membetter-[0-9a-f]{12}\.wav\]$/);
    expect(Object.values(index)).toContain(/src="([^"]+)"/.exec(fields[4]!)![1]);
    expect(notes[0]!.csum).toBe(csum("sink"));
    expect(new Set(notes.map((n) => n.guid)).size).toBe(3);
    expect(Number(Object.keys(models)[0])).toBe(notes[0]!.mid);

    const cards = anki.prepare("SELECT * FROM cards ORDER BY id").all() as { nid: number; did: number; due: number; ord: number; type: number; queue: number }[];
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.due)).toEqual([1, 2, 3]);
    expect(new Set(cards.map((c) => c.nid)).size).toBe(3);
    expect(cards.every((c) => c.ord === 0 && c.type === 0 && c.queue === 0)).toBe(true);
    const deckIds = Object.entries(JSON.parse(col["decks"] as string) as Record<string, { name: string }>);
    const deckOf = (did: number) => deckIds.find(([id]) => Number(id) === did)![1].name;
    expect(cards.map((c) => deckOf(c.did))).toEqual(["Kitchen: words::First", "Kitchen: words::First", "Kitchen: words::Second"]);
    anki.close();
  });

  it("leaves out media that is missing and still exports the words", async () => {
    const it0 = item();
    media.remove("img");
    const out = join(dir, "c.apkg");
    expect((await writeApkg(it0, media, out)).notes).toBe(3);
    const files = unzipSync(readFileSync(out));
    expect(Object.keys(files).sort()).toEqual(["0", "collection.anki2", "media"]);
  });

  it("computes Anki's checksum from text without HTML", () => {
    expect(csum("<b>sink</b>")).toBe(csum("sink"));
    expect(csum("sink")).toBe(parseInt(createHash("sha1").update("sink").digest("hex").slice(0, 8), 16));
  });
});

describe("CSV parsing", () => {
  it("handles quotes, embedded delimiters, doubled quotes, line breaks and a byte order mark", () => {
    const text = '﻿word,meaning\r\n"sink","a bowl, for washing"\r\n"say ""hi""","line1\nline2"\r\nlast,row';
    expect(parseCsv(text, ",")).toEqual([
      ["word", "meaning"],
      ["sink", "a bowl, for washing"],
      ['say "hi"', "line1\nline2"],
      ["last", "row"],
    ]);
  });
  it("ignores blank lines and keeps empty cells", () => {
    expect(parseCsv("a,,c\n\n,b,\n", ",")).toEqual([["a", "", "c"], ["", "b", ""]]);
  });
  it("detects comma, semicolon and tab", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb\n1\t2")).toBe("\t");
    expect(detectDelimiter("single column\nanother")).toBe(",");
    expect(detectDelimiter("one, two\nthree; four; five\nsix")).toBe(",");
  });
});

describe("CSV import", () => {
  const write = (text: string) => {
    const path = join(dir, "words.csv");
    writeFileSync(path, text);
    return path;
  };
  const base = { teachingLanguageId: "en-gb", speakersLanguageId: "pt-br", title: "From CSV" };

  it("previews the file and guesses the header", () => {
    const p = previewCsv(write("Word;Meaning\nsink;pia\nwash;lavar\n"));
    expect(p).toMatchObject({ delimiter: ";", columns: 2, totalRows: 3, looksLikeHeader: true });
    expect(p.sample).toHaveLength(3);
    expect(previewCsv(write("sink,pia\n")).looksLikeHeader).toBe(false);
  });

  it("creates a course and reports the skipped rows with reasons", () => {
    const path = write("word,meaning,example,ipa\nsink,a bowl,I wash it,/sɪŋk/\n,no word,,\nwash,clean,,\nSINK,repeat,,\n" + `big,${"x".repeat(5001)},,\n` + "ladder,steps,,\n");
    const result = importCsv(db, { path, hasHeader: true, mapping: { word: 0, meaning: 1, example: 2, ipa: 3 }, ...base });
    expect(result.imported).toBe(3);
    expect(result.skipped).toEqual([
      { row: 3, reason: "The word is empty." },
      { row: 5, reason: "The word is a repeat of row 2." },
      { row: 6, reason: "The meaning or example is too long." },
    ]);
    const snap = loadLibrary(db);
    const created = snap.createdCourses[0]!;
    expect(created).toMatchObject({ title: "From CSV", teachingLanguageId: "en-gb", speakersLanguageId: "pt-br", totalItems: 3, categoryId: "lang-en-gb" });
    const words = snap.courseLevels[created.id]![0]!.words;
    expect(words.map((w) => [w.text, w.meaning, w.ipa])).toEqual([["sink", "a bowl", "sɪŋk"], ["wash", "clean", undefined], ["ladder", "steps", undefined]]);
  });

  it("maps other columns, works without a header or optional columns, and splits long lists into levels", () => {
    const lines = Array.from({ length: 250 }, (_, i) => `meaning ${i};word${i}`).join("\n");
    const result = importCsv(db, { path: write(lines), hasHeader: false, mapping: { word: 1, meaning: 0, example: null, ipa: null }, ...base });
    expect(result.imported).toBe(250);
    const levels = loadLibrary(db).courseLevels[result.courseId]!;
    expect(levels.map((l) => l.words.length)).toEqual([100, 100, 50]);
    expect(levels[0]!.words[0]).toMatchObject({ text: "word0", meaning: "meaning 0" });
  });

  it("imports 5,000 rows quickly", () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `word${i},meaning ${i}`).join("\n");
    const started = Date.now();
    const result = importCsv(db, { path: write(lines), hasHeader: false, mapping: { word: 0, meaning: 1, example: null, ipa: null }, ...base });
    expect(result.imported).toBe(5000);
    expect(Date.now() - started).toBeLessThan(20_000);
  });

  it("refuses files with no usable words, binary files and missing files, creating nothing", () => {
    expect(() => importCsv(db, { path: write("a,b\n,\n,x\n"), hasHeader: true, mapping: { word: 0, meaning: 1, example: null, ipa: null }, ...base })).toThrow(/No usable words/);
    expect(() => previewCsv(write("a\u0000b,c"))).toThrow(CsvError);
    expect(() => previewCsv(join(dir, "missing.csv"))).toThrow(/could not be read/);
    expect(() => previewCsv(write(""))).toThrow(/no rows/);
    expect(loadLibrary(db).createdCourses).toEqual([]);
  });
});
