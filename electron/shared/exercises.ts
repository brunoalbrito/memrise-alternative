import { z } from "zod";

/** Every way a word can be practiced. */
export const EXERCISE_KINDS = [
  "type",
  "word-to-image",
  "image-to-word",
  "word-to-meaning",
  "meaning-to-word",
  "audio-to-word",
  "word-to-audio",
  "audio-to-type",
] as const;

export type ExerciseKind = (typeof EXERCISE_KINDS)[number];
export const ExerciseKindSchema = z.enum(EXERCISE_KINDS);

/** Kinds answered by choosing one of several options. */
export const CHOICE_KINDS: readonly ExerciseKind[] = ["word-to-image", "image-to-word", "word-to-meaning", "meaning-to-word", "audio-to-word", "word-to-audio"];
export const isChoiceKind = (kind: ExerciseKind): boolean => CHOICE_KINDS.includes(kind);
