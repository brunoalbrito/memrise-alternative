import type { ExerciseKind } from "./exercises";

export const EXERCISE_INFO: Record<ExerciseKind, { label: string; description: string; group: "choose" | "listen" | "type" }> = {
  type: { label: "Type the word", description: "See a picture or meaning and type the word, with letter tiles and hints.", group: "type" },
  "word-to-image": { label: "Pick the picture", description: "See a word and pick its picture among four.", group: "choose" },
  "image-to-word": { label: "Pick the word for a picture", description: "See a picture and pick its word among four.", group: "choose" },
  "word-to-meaning": { label: "Pick the meaning", description: "See a word and pick what it means.", group: "choose" },
  "meaning-to-word": { label: "Pick the word for a meaning", description: "See a meaning and pick the word.", group: "choose" },
  "audio-to-word": { label: "Hear it, pick the word", description: "Hear a recording and pick the written word. Needs audio.", group: "listen" },
  "word-to-audio": { label: "Pick the recording", description: "See a word and pick which recording says it. Needs audio.", group: "listen" },
  "audio-to-type": { label: "Hear it, type it", description: "Hear a recording and type the word. Needs audio.", group: "listen" },
};

export const PRESETS: { id: string; label: string; kinds: (kind: ExerciseKind) => boolean }[] = [
  { id: "all", label: "All types", kinds: () => true },
  { id: "no-typing", label: "No typing", kinds: (k) => k !== "type" && k !== "audio-to-type" },
  { id: "typing-only", label: "Typing only", kinds: (k) => k === "type" || k === "audio-to-type" },
];
