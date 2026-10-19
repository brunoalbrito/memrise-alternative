import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { strToU8, zipSync } from "fflate";
import { sampleCourses, type SampleWord } from "./sample-data.ts";
import { makePng, makeWav, sha256 } from "./sample-media.ts";

/**
 * Builds a MemBetter library file (`.membetter`) with the sample courses. It only uses the public file format, the same one the
 * app exports, so importing it is the same as importing a file from a friend.
 */
export function buildSampleLibrary(now: Date = new Date()): Uint8Array {
  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(
      JSON.stringify({ format: "membetter-course", formatVersion: 1, kind: "library", appVersion: "samples", exportedAt: now.toISOString() }),
    ),
  };
  const media = (word: SampleWord, kind: "image" | "audio") => {
    const bytes = kind === "image" ? makePng(word.text) : makeWav(word.text);
    const ext = kind === "image" ? "png" : "wav";
    const hash = sha256(bytes);
    files[`media/${hash}.${ext}`] = bytes;
    return [{ id: `sample-${kind}-${hash.slice(0, 12)}`, name: `${word.text}.${ext}`, type: kind === "image" ? "image/png" : "audio/wav", size: bytes.length, hash }];
  };
  for (const course of sampleCourses) {
    const content = {
      course: {
        id: course.id,
        title: course.title,
        categoryId: `lang-${course.teachingLanguageId}`,
        teaching: true,
        teachingLanguageId: course.teachingLanguageId,
        speakersLanguageId: course.speakersLanguageId,
      },
      levels: course.levels.map((level) => ({
        id: level.id,
        name: level.name,
        tested: level.tested,
        words: level.words.map(({ image, audio, ...word }) => ({
          ...word,
          images: image ? media({ ...word, image, audio }, "image") : [],
          audio: audio ? media({ ...word, image, audio }, "audio") : [],
        })),
      })),
    };
    files[`courses/${course.id}/course.json`] = strToU8(JSON.stringify(content));
  }
  return zipSync(files, { level: 6 });
}

// Run as a script: `pnpm samples [output file]`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = resolve(process.argv[2] ?? "dev-data/sample-courses.membetter");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buildSampleLibrary());
  console.log(`Wrote the sample course to ${out}`);
  console.log("Open MemBetter and use Import on Home to load them.");
}
