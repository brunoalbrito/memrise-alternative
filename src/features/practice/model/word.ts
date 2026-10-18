import { isLetter, matches, sameLetter } from "./text";
import type { Tile } from "./tiles";

/** What the learner has done with the current word. Letters are always tiles of the tray, picked in order. */
export interface WordState {
  tiles: Tile[];
  /** Tray positions in the order they were picked. */
  picked: number[];
  hints: number;
  /** Full-length answers that were wrong. */
  attempts: number;
}

export interface Rules {
  accentTolerant: boolean;
}

export const startWord = (tiles: Tile[]): WordState => ({ tiles, picked: [], hints: 0, attempts: 0 });

export const typedLetters = (state: WordState): string[] => state.picked.map((i) => state.tiles[i]!.letter);

export const isUsed = (state: WordState, index: number): boolean => state.picked.includes(index);

export function pickTile(state: WordState, index: number): WordState | null {
  if (index < 0 || index >= state.tiles.length || isUsed(state, index)) return null;
  if (state.picked.length >= state.tiles.length) return null;
  return { ...state, picked: [...state.picked, index] };
}

/** Types a letter from the keyboard: uses the first free tile with that letter. Returns null when there is none. */
export function pickLetter(state: WordState, letter: string, rules: Rules): WordState | null {
  const exact = state.tiles.find((tile) => !isUsed(state, tile.index) && sameLetter(tile.letter, letter, false));
  const tile = exact ?? (rules.accentTolerant ? state.tiles.find((t) => !isUsed(state, t.index) && sameLetter(t.letter, letter, true)) : undefined);
  return tile ? pickTile(state, tile.index) : null;
}

export function backspace(state: WordState): WordState | null {
  return state.picked.length === 0 ? null : { ...state, picked: state.picked.slice(0, -1) };
}

/** Length of the picked letters that are right so far. */
export function correctPrefix(state: WordState, answerLetters: string[], rules: Rules): number {
  const typed = typedLetters(state);
  let n = 0;
  while (n < typed.length && n < answerLetters.length && sameLetter(typed[n]!, answerLetters[n]!, rules.accentTolerant)) n += 1;
  return n;
}

/** Fills in the next correct letter. A wrong tail is removed first. Returns null when the word is already complete. */
export function hint(state: WordState, answerLetters: string[], rules: Rules): WordState | null {
  const keep = correctPrefix(state, answerLetters, rules);
  if (keep >= answerLetters.length) return null;
  const base: WordState = { ...state, picked: state.picked.slice(0, keep) };
  const wanted = answerLetters[keep]!;
  const tile = base.tiles.find((t) => !isUsed(base, t.index) && sameLetter(t.letter, wanted, rules.accentTolerant));
  if (!tile) return null;
  return { ...base, picked: [...base.picked, tile.index], hints: state.hints + 1 };
}

export type Evaluation = "incomplete" | "correct" | "wrong";

export function evaluate(state: WordState, answerLetters: string[], rules: Rules): Evaluation {
  if (state.picked.length < answerLetters.length) return "incomplete";
  return matches(typedLetters(state), answerLetters, rules.accentTolerant) ? "correct" : "wrong";
}

/**
 * The text shown in the input: the picked letters, with the answer's spaces and punctuation filled in
 * where the letters before them have been typed.
 */
export function displayText(state: WordState, answer: string): string {
  const typed = typedLetters(state);
  let used = 0;
  let out = "";
  for (const character of Array.from(answer.normalize("NFC"))) {
    if (isLetter(character)) {
      if (used >= typed.length) break;
      out += typed[used]!;
      used += 1;
    } else if (used > 0 && used <= typed.length) {
      out += character;
    }
  }
  return out;
}
