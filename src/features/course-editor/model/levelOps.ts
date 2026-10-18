import type { CourseLevel, MediaRef, Word } from "../../home";

export type MediaKind = "images" | "audio";

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function defaultName(position: number) {
  return `Level ${position}`;
}

function mapLevel(
  levels: CourseLevel[],
  levelId: string,
  change: (level: CourseLevel) => CourseLevel,
): CourseLevel[] {
  return levels.map((level) => (level.id === levelId ? change(level) : level));
}

function mapWord(
  levels: CourseLevel[],
  levelId: string,
  wordId: string,
  change: (word: Word) => Word,
): CourseLevel[] {
  return mapLevel(levels, levelId, (level) => ({
    ...level,
    words: level.words.map((word) => (word.id === wordId ? change(word) : word)),
  }));
}

export function addLevel(levels: CourseLevel[]): CourseLevel[] {
  return [
    ...levels,
    { id: newId("level"), name: defaultName(levels.length + 1), tested: "", words: [] },
  ];
}

export function renameLevel(
  levels: CourseLevel[],
  levelId: string,
  name: string,
): CourseLevel[] {
  const position = levels.findIndex((level) => level.id === levelId) + 1;
  const trimmed = name.trim();
  return mapLevel(levels, levelId, (level) => ({
    ...level,
    name: trimmed === "" ? defaultName(position) : name,
  }));
}

export function setTested(
  levels: CourseLevel[],
  levelId: string,
  tested: string,
): CourseLevel[] {
  return mapLevel(levels, levelId, (level) => ({ ...level, tested }));
}

/** Copies a level (new ids, same media refs, nothing learned) and inserts it after the original. */
export function duplicateLevel(levels: CourseLevel[], levelId: string): CourseLevel[] {
  const index = levels.findIndex((level) => level.id === levelId);
  if (index < 0) return levels;
  const original = levels[index];
  const copy: CourseLevel = {
    ...original,
    id: newId("level"),
    words: original.words.map((word) => ({
      ...word,
      id: newId("word"),
      learned: false,
      images: [...word.images],
      audio: [...word.audio],
    })),
  };
  return [...levels.slice(0, index + 1), copy, ...levels.slice(index + 1)];
}

export function deleteLevel(levels: CourseLevel[], levelId: string): CourseLevel[] {
  return levels.filter((level) => level.id !== levelId);
}

export function addWord(
  levels: CourseLevel[],
  levelId: string,
): { levels: CourseLevel[]; wordId: string } {
  const wordId = newId("word");
  const word: Word = {
    id: wordId,
    text: "",
    meaning: "",
    example: "",
    images: [],
    audio: [],
    learned: false,
  };
  return {
    levels: mapLevel(levels, levelId, (level) => ({
      ...level,
      words: [...level.words, word],
    })),
    wordId,
  };
}

export function updateWord(
  levels: CourseLevel[],
  levelId: string,
  wordId: string,
  patch: Partial<Pick<Word, "text" | "meaning" | "example">>,
): CourseLevel[] {
  return mapWord(levels, levelId, wordId, (word) => ({ ...word, ...patch }));
}

export function deleteWord(
  levels: CourseLevel[],
  levelId: string,
  wordId: string,
): CourseLevel[] {
  return mapLevel(levels, levelId, (level) => ({
    ...level,
    words: level.words.filter((word) => word.id !== wordId),
  }));
}

export function attachMedia(
  levels: CourseLevel[],
  levelId: string,
  wordId: string,
  kind: MediaKind,
  ref: MediaRef,
): CourseLevel[] {
  return mapWord(levels, levelId, wordId, (word) => ({
    ...word,
    [kind]: [...word[kind], ref],
  }));
}

export function removeMedia(
  levels: CourseLevel[],
  levelId: string,
  wordId: string,
  kind: MediaKind,
  mediaId: string,
): CourseLevel[] {
  return mapWord(levels, levelId, wordId, (word) => ({
    ...word,
    [kind]: word[kind].filter((ref) => ref.id !== mediaId),
  }));
}
