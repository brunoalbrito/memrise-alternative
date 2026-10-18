const LETTER = /[\p{L}\p{N}]/u;

export const isLetter = (character: string): boolean => LETTER.test(character);

/** The letters of an answer, in order. Spaces, hyphens, apostrophes and other punctuation are not letters. */
export function lettersOf(answer: string): string[] {
  return Array.from(answer.normalize("NFC")).filter(isLetter);
}

/** Case-insensitive form of a letter; with accent tolerance, accents are removed too. */
export function fold(letter: string, accentTolerant: boolean): string {
  const lower = letter.normalize("NFC").toLowerCase();
  return accentTolerant ? lower.normalize("NFD").replace(/\p{M}/gu, "") : lower;
}

export const sameLetter = (a: string, b: string, accentTolerant: boolean): boolean =>
  fold(a, accentTolerant) === fold(b, accentTolerant);

/** True when the typed letters spell the answer (ignoring case, spaces and, optionally, accents). */
export function matches(typed: string[], answerLetters: string[], accentTolerant: boolean): boolean {
  return typed.length === answerLetters.length && typed.every((letter, i) => sameLetter(letter, answerLetters[i]!, accentTolerant));
}
