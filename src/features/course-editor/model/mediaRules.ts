import type { MediaKind } from "./levelOps";

const MB = 1024 * 1024;

const rules = {
  images: {
    mimes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
    extensions: ["png", "jpg", "jpeg", "gif", "webp"],
    maxBytes: 2 * MB,
    typeMessage: "Choose a PNG, JPEG, GIF or WebP image.",
    sizeMessage: "This file is too large (maximum 2 MB).",
    countMessage: "A word can have at most 5 images.",
  },
  audio: {
    mimes: [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
      "audio/aac",
    ],
    extensions: ["mp3", "wav", "ogg", "m4a", "aac"],
    maxBytes: 3 * MB,
    typeMessage: "Choose an MP3, WAV, OGG or M4A audio file.",
    sizeMessage: "This file is too large (maximum 3 MB).",
    countMessage: "A word can have at most 5 audio files.",
  },
} as const;

export const MAX_MEDIA_PER_WORD = 5;

export const ACCEPT = {
  images: "image/png,image/jpeg,image/gif,image/webp",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac",
} as const;

/** Returns an error message, or null when the file can be imported. */
export function validateMediaFile(
  file: File,
  kind: MediaKind,
  currentCount: number,
): string | null {
  const rule = rules[kind];
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk =
    file.type !== ""
      ? (rule.mimes as readonly string[]).includes(file.type)
      : (rule.extensions as readonly string[]).includes(extension);
  if (!typeOk) return rule.typeMessage;
  if (file.size > rule.maxBytes) return rule.sizeMessage;
  if (currentCount >= MAX_MEDIA_PER_WORD) return rule.countMessage;
  return null;
}
