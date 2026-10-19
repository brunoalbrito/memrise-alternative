import { CHOICE_KINDS, EXERCISE_KINDS, isChoiceKind, type ExerciseKind } from "../../../../electron/shared/exercises";
import type { Word } from "../../home";
import { mulberry32 } from "./tiles";

export { CHOICE_KINDS, EXERCISE_KINDS, isChoiceKind };
export type { ExerciseKind };

/** A word of the course, with the level it belongs to (distractors prefer the same level). */
export interface PoolWord {
  word: Word;
  levelId: string;
}

export interface ChoiceOption {
  /** Written text (a word or a meaning). */
  text?: string;
  /** A stored picture. */
  imageId?: string;
  /** A stored recording. */
  audioId?: string;
}

export interface Exercise {
  kind: ExerciseKind;
  /** Four options for choice kinds, none otherwise. */
  options: ChoiceOption[];
  /** Index of the right option (0 for kinds without options). */
  correct: number;
}

export const CHOICES = 4;

const hasText = (w: Word) => w.text.trim() !== "";
export const hasMeaning = (w: Word) => w.meaning.trim() !== "";
export const hasImage = (w: Word) => w.images.length > 0;
export const hasAudio = (w: Word) => w.audio.length > 0;
/** Something to see when typing the answer (a picture, meaning or example). */
export const hasWrittenPrompt = (w: Word): boolean => hasImage(w) || hasMeaning(w) || w.example.trim() !== "";
/** A word can be practiced when it has anything to prompt with, including a recording. */
export const hasPrompt = (w: Word): boolean => hasWrittenPrompt(w) || hasAudio(w);

const key = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");

function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** What identifies an option, so no two options look the same. */
type Describe = (w: Word) => ChoiceOption | null;

const describers: Partial<Record<ExerciseKind, Describe>> = {
  "word-to-image": (w) => (hasImage(w) ? { imageId: w.images[0]!.id } : null),
  "image-to-word": (w) => ({ text: w.text.trim() }),
  "word-to-meaning": (w) => (hasMeaning(w) ? { text: w.meaning.trim() } : null),
  "meaning-to-word": (w) => ({ text: w.text.trim() }),
  "audio-to-word": (w) => ({ text: w.text.trim() }),
  "word-to-audio": (w) => (hasAudio(w) ? { audioId: w.audio[0]!.id } : null),
};

/** What the word itself must have for the kind to make sense. */
const needs: Record<ExerciseKind, (w: Word) => boolean> = {
  type: hasWrittenPrompt,
  "word-to-image": hasImage,
  "image-to-word": hasImage,
  "word-to-meaning": hasMeaning,
  "meaning-to-word": hasMeaning,
  "audio-to-word": hasAudio,
  "word-to-audio": hasAudio,
  "audio-to-type": hasAudio,
};

const optionKey = (o: ChoiceOption): string => o.imageId ?? o.audioId ?? key(o.text ?? "");

/**
 * Options for a choice exercise: the right answer and three others from the course (same level first), all different from one
 * another. Returns null when the course does not have enough suitable words.
 */
export function buildOptions(kind: ExerciseKind, word: Word, levelId: string, pool: PoolWord[], random: () => number): Exercise | null {
  if (!isChoiceKind(kind)) return needs[kind](word) ? { kind, options: [], correct: 0 } : null;
  const describe = describers[kind]!;
  if (!needs[kind](word)) return null;
  const right = describe(word);
  if (!right) return null;

  const taken = new Set([optionKey(right)]);
  const others = pool.filter((p) => p.word.id !== word.id && hasText(p.word));
  const same = shuffle(others.filter((p) => p.levelId === levelId), random);
  const elsewhere = shuffle(others.filter((p) => p.levelId !== levelId), random);
  const wrong: ChoiceOption[] = [];
  for (const p of [...same, ...elsewhere]) {
    const option = describe(p.word);
    if (!option) continue;
    const k = optionKey(option);
    if (k === "" || taken.has(k)) continue;
    taken.add(k);
    wrong.push(option);
    if (wrong.length === CHOICES - 1) break;
  }
  if (wrong.length < CHOICES - 1) return null;
  const options = shuffle([right, ...wrong], random);
  return { kind, options, correct: options.indexOf(right) };
}

export type Stage = "new" | "learning" | "review";
export type SessionKind = "learn" | "classic" | "speed";

/** Stage of a word from its card state (0 new, 1 learning, 2 review, 3 relearning). */
export const stageOf = (state: number | undefined): Stage => (state === 2 ? "review" : state === 1 || state === 3 ? "learning" : "new");

const EASY: ExerciseKind[] = ["word-to-image", "image-to-word", "meaning-to-word", "word-to-meaning", "audio-to-word", "word-to-audio"];
const HARD: ExerciseKind[] = ["type", "audio-to-type"];

export interface ChooseInput {
  word: Word;
  levelId: string;
  pool: PoolWord[];
  stage: Stage;
  session: SessionKind;
  /** Kinds the learner has turned on. */
  enabled: readonly ExerciseKind[];
  seed: number;
}

/**
 * Picks the exercise for a word. New and just-learned words get easier choices, words in review get typing and listening,
 * speed review uses choices. Only kinds that are on and possible are used; typing is the last resort so a word is never skipped.
 */
export function chooseExercise({ word, levelId, pool, stage, session, enabled, seed }: ChooseInput): Exercise {
  const random = mulberry32(seed);
  const possible = (kinds: ExerciseKind[]): Exercise[] =>
    shuffle(kinds.filter((k) => enabled.includes(k)), random).flatMap((k) => buildOptions(k, word, levelId, pool, random) ?? []);

  const easy = possible(EASY);
  const hard = possible(HARD);
  // Words in review sometimes get a choice for variety (one time in four).
  const varied = stage === "review" && easy.length > 0 && random() < 0.25;
  const ordered = session === "speed" || stage !== "review" || varied ? [...easy, ...hard] : [...hard, ...easy];

  const first = ordered[0];
  if (first) return first;
  // Nothing that is on is possible for this word: fall back so it can still be practiced.
  const fallback: ExerciseKind = hasWrittenPrompt(word) ? "type" : "audio-to-type";
  return { kind: fallback, options: [], correct: 0 };
}
