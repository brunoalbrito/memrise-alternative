export interface Tile {
  /** Position of the tile in the tray (0-based). Keys 1 to 8 pick tiles 0 to 7. */
  index: number;
  letter: string;
}

/** Small deterministic random generator so a word's tiles are stable while it is on screen. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** One tile per letter, shuffled. The result is never in the correct order unless that is the only possible order. */
export function makeTiles(letters: string[], seed: number): Tile[] {
  const random = mulberry32(seed);
  const order = letters.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  let shuffled = order.map((source) => letters[source]!);
  const sorted = shuffled.every((letter, i) => letter === letters[i]);
  const allSame = letters.every((letter) => letter === letters[0]);
  if (sorted && letters.length > 1 && !allSame) shuffled = [...shuffled.slice(1), shuffled[0]!];
  return shuffled.map((letter, index) => ({ index, letter }));
}

/** The shortcut key shown on a tile, or null when the tile has none (only the first eight do). */
export const tileShortcut = (index: number): string | null => (index < 8 ? String(index + 1) : null);
