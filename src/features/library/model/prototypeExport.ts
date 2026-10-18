import { strToU8, zipSync } from "fflate";
import { getMedia } from "../../../shared/media/mediaStore";
import { sampleCourses, sampleLevels } from "../../home";
import type { Course, CourseEdit, CourseLevel, MediaRef } from "../../home";

/** What the browser prototype kept in `localStorage` under `membetter.learner` (zustand persist format). */
export interface LegacyState {
  createdCourses?: Course[];
  courseEdits?: Record<string, CourseEdit>;
  courseLevels?: Record<string, CourseLevel[]>;
}

const sha256 = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
};

/**
 * Builds a library `.membetter` file from the prototype's data: every course the learner created, and every
 * sample course they edited. Progress, goals and removed courses are not included.
 */
export async function buildLegacyLibrary(
  state: LegacyState,
  loadMedia: (id: string) => Promise<Blob | undefined> = getMedia,
  now: () => Date = () => new Date(),
): Promise<Uint8Array | null> {
  const edits = state.courseEdits ?? {};
  const levelsOf = state.courseLevels ?? {};
  const courses: Course[] = [
    ...sampleCourses
      .filter((c) => edits[c.id] !== undefined || levelsOf[c.id] !== undefined)
      .map((c) => ({ ...c, ...edits[c.id] })),
    ...(state.createdCourses ?? []),
  ];
  if (courses.length === 0) return null;

  const files: Record<string, Uint8Array> = {};
  const hashByMedia = new Map<string, string | null>();

  const refOf = async (ref: MediaRef) => {
    if (!hashByMedia.has(ref.id)) {
      const blob = await loadMedia(ref.id).catch(() => undefined);
      if (!blob) hashByMedia.set(ref.id, null);
      else {
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const hash = await sha256(bytes);
        const ext = EXTENSIONS[ref.type] ?? EXTENSIONS[blob.type];
        if (!ext) hashByMedia.set(ref.id, null);
        else {
          files[`media/${hash}.${ext}`] = bytes;
          hashByMedia.set(ref.id, hash);
        }
      }
    }
    const hash = hashByMedia.get(ref.id);
    return hash ? { ...ref, hash } : null;
  };

  for (const course of courses) {
    const levels = levelsOf[course.id] ?? sampleLevels[course.id] ?? [];
    const outLevels = [];
    for (const level of levels) {
      const words = [];
      for (const word of level.words) {
        const images = (await Promise.all(word.images.map(refOf))).filter((r) => r !== null);
        const audio = (await Promise.all(word.audio.map(refOf))).filter((r) => r !== null);
        words.push({
          id: word.id,
          text: word.text,
          meaning: word.meaning,
          example: word.example,
          ...(word.ipa !== undefined ? { ipa: word.ipa } : {}),
          images,
          audio,
        });
      }
      outLevels.push({ id: level.id, name: level.name, tested: level.tested, words });
    }
    const { totalItems, itemsLearned, itemsDue, learnedToday, ...content } = course;
    void [totalItems, itemsLearned, itemsDue, learnedToday];
    files[`courses/${course.id}/course.json`] = strToU8(JSON.stringify({ course: content, levels: outLevels }));
  }

  files["manifest.json"] = strToU8(
    JSON.stringify({
      format: "membetter-course",
      formatVersion: 1,
      kind: "library",
      appVersion: "prototype",
      exportedAt: now().toISOString(),
    }),
  );
  return zipSync(files, { level: 6 });
}

/** Saves the prototype's data as a file the desktop app can import. */
export async function exportLegacyData(): Promise<void> {
  let state: LegacyState = {};
  try {
    const raw = localStorage.getItem("membetter.learner");
    if (raw) state = (JSON.parse(raw) as { state?: LegacyState }).state ?? {};
  } catch {
    state = {};
  }
  const bytes = await buildLegacyLibrary(state);
  if (!bytes) {
    alert("There is no data to export yet. Create or edit a course first.");
    return;
  }
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "membetter-library.membetter";
  link.click();
  URL.revokeObjectURL(url);
}
