import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type Database from "better-sqlite3";

type Db = Database.Database;

export type MediaKind = "images" | "audio";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 3 * 1024 * 1024;

export class MediaError extends Error {
  constructor(
    readonly code: "unsupported_type" | "too_large" | "invalid_id",
    message: string,
  ) {
    super(message);
    this.name = "MediaError";
  }
}

interface Sniffed {
  kind: MediaKind;
  contentType: string;
  ext: string;
}

const ascii = (bytes: Uint8Array, start: number, text: string): boolean =>
  text.split("").every((ch, i) => bytes[start + i] === ch.charCodeAt(0));

/** Detects the real file type from its first bytes. Never trusts the name or the declared type. SVG is not accepted. */
export function sniff(bytes: Uint8Array): Sniffed | null {
  if (bytes.length < 12) return null;
  const [b0, b1, b2] = bytes as unknown as [number, number, number];
  if (b0 === 0x89 && ascii(bytes, 1, "PNG\r\n")) return { kind: "images", contentType: "image/png", ext: "png" };
  if (b0 === 0xff && b1 === 0xd8 && b2 === 0xff) return { kind: "images", contentType: "image/jpeg", ext: "jpg" };
  if (ascii(bytes, 0, "GIF87a") || ascii(bytes, 0, "GIF89a")) return { kind: "images", contentType: "image/gif", ext: "gif" };
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) return { kind: "images", contentType: "image/webp", ext: "webp" };
  if (ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WAVE")) return { kind: "audio", contentType: "audio/wav", ext: "wav" };
  if (ascii(bytes, 0, "OggS")) return { kind: "audio", contentType: "audio/ogg", ext: "ogg" };
  if (ascii(bytes, 4, "ftyp")) return { kind: "audio", contentType: "audio/mp4", ext: "m4a" };
  // AAC in ADTS framing (layer bits 00) must be checked before MP3 frame sync.
  if (b0 === 0xff && (b1 & 0xf6) === 0xf0) return { kind: "audio", contentType: "audio/aac", ext: "aac" };
  if (ascii(bytes, 0, "ID3") || (b0 === 0xff && (b1 & 0xe0) === 0xe0)) return { kind: "audio", contentType: "audio/mpeg", ext: "mp3" };
  return null;
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

export interface MediaFile {
  path: string;
  contentType: string;
}

export class MediaStore {
  constructor(
    private readonly db: Db,
    readonly dir: string,
    private readonly now: () => Date = () => new Date(),
  ) {
    mkdirSync(dir, { recursive: true });
  }

  /** Validates and stores a file under `id`. Same content is stored once. */
  put(id: string, bytes: Uint8Array, originalName: string): { kind: MediaKind; contentType: string; size: number } {
    if (!ID_PATTERN.test(id)) throw new MediaError("invalid_id", "Invalid media id.");
    const found = sniff(bytes);
    if (!found) throw new MediaError("unsupported_type", "Choose a PNG, JPEG, GIF or WebP image, or an MP3, WAV, OGG or M4A audio file.");
    const limit = found.kind === "images" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
    if (bytes.length > limit) {
      throw new MediaError("too_large", `This file is too large (maximum ${limit / 1024 / 1024} MB).`);
    }

    const hash = createHash("sha256").update(bytes).digest("hex");
    const file = join(this.dir, `${hash}.${found.ext}`);
    if (!existsSync(file)) {
      // Write to a temp name and rename so a crash never leaves a partial file under the final name.
      const tmp = `${file}.${process.pid}.tmp`;
      writeFileSync(tmp, bytes);
      renameSync(tmp, file);
    }
    this.db
      .prepare(
        `INSERT INTO media (id, hash, kind, content_type, ext, size_bytes, original_name, created_at)
         VALUES (@id, @hash, @kind, @contentType, @ext, @size, @name, @at)
         ON CONFLICT (id) DO UPDATE SET hash = @hash, kind = @kind, content_type = @contentType, ext = @ext,
           size_bytes = @size, original_name = @name`,
      )
      .run({
        id,
        hash,
        kind: found.kind,
        contentType: found.contentType,
        ext: found.ext,
        size: bytes.length,
        name: originalName.slice(0, 300),
        at: this.now().toISOString(),
      });
    return { kind: found.kind, contentType: found.contentType, size: bytes.length };
  }

  /** Where a reference id lives on disk, or null. Paths never come from the caller. */
  resolve(id: string): MediaFile | null {
    if (!ID_PATTERN.test(id)) return null;
    const row = this.db.prepare("SELECT hash, ext, content_type FROM media WHERE id = ?").get(id) as
      | { hash: string; ext: string; content_type: string }
      | undefined;
    if (!row) return null;
    const path = join(this.dir, `${row.hash}.${row.ext}`);
    return existsSync(path) ? { path, contentType: row.content_type } : null;
  }

  /** Removes one reference; the file goes away when nothing else shares it. */
  remove(id: string): void {
    const row = this.db.prepare("SELECT hash, ext FROM media WHERE id = ?").get(id) as { hash: string; ext: string } | undefined;
    if (!row) return;
    this.db.prepare("DELETE FROM media WHERE id = ?").run(id);
    this.deleteIfUnshared(row.hash, row.ext);
  }

  private deleteIfUnshared(hash: string, ext: string): void {
    const shared = this.db.prepare("SELECT 1 FROM media WHERE hash = ? LIMIT 1").get(hash);
    if (!shared) rmSync(join(this.dir, `${hash}.${ext}`), { force: true });
  }

  /** Ids currently used by any word. */
  referencedIds(): Set<string> {
    const rows = this.db
      .prepare(
        `SELECT json_extract(j.value, '$.id') AS id FROM words, json_each(words.images) j
         UNION SELECT json_extract(j.value, '$.id') FROM words, json_each(words.audio) j`,
      )
      .all() as { id: string }[];
    return new Set(rows.map((r) => r.id));
  }

  /** Deletes media no word refers to, and stray files and temp files with no row. Run at startup. */
  collectGarbage(): { removedRows: number; removedFiles: number } {
    const used = this.referencedIds();
    const all = this.db.prepare("SELECT id, hash, ext FROM media").all() as { id: string; hash: string; ext: string }[];
    let removedRows = 0;
    for (const row of all) {
      if (!used.has(row.id)) {
        this.remove(row.id);
        removedRows += 1;
      }
    }
    const known = new Set(
      (this.db.prepare("SELECT hash, ext FROM media").all() as { hash: string; ext: string }[]).map((r) => `${r.hash}.${r.ext}`),
    );
    let removedFiles = 0;
    for (const name of readdirSync(this.dir)) {
      if (!known.has(name)) {
        rmSync(join(this.dir, name), { force: true });
        removedFiles += 1;
      }
    }
    return { removedRows, removedFiles };
  }
}
