import { describe, expect, it } from "vitest";
import { lettersOf, matches } from "../../src/features/practice/model/text";
import { hashSeed, makeTiles, tileShortcut } from "../../src/features/practice/model/tiles";
import { resultOf, wordPoints } from "../../src/features/practice/model/points";
import {
  backspace,
  displayText,
  evaluate,
  hint,
  pickLetter,
  pickTile,
  startWord,
  typedLetters,
  type Rules,
  type WordState,
} from "../../src/features/practice/model/word";

const strict: Rules = { accentTolerant: false };
const tolerant: Rules = { accentTolerant: true };
const stateFor = (answer: string, seed = 1): { state: WordState; letters: string[] } => {
  const letters = lettersOf(answer);
  return { state: startWord(makeTiles(letters, seed)), letters };
};
const type = (state: WordState, text: string, rules = strict): WordState => {
  let current = state;
  for (const ch of text) current = pickLetter(current, ch, rules) ?? current;
  return current;
};

describe("letters and matching", () => {
  it("ignores spaces, hyphens and apostrophes", () => {
    expect(lettersOf("laundry folding")).toEqual([..."laundryfolding"]);
    expect(lettersOf("don't-stop")).toEqual([..."dontstop"]);
    expect(lettersOf("ação")).toEqual([..."ação"]);
  });
  it("matches ignoring case, and accents only when tolerant", () => {
    expect(matches([..."Sink"], lettersOf("sink"), false)).toBe(true);
    expect(matches([..."acao"], lettersOf("ação"), false)).toBe(false);
    expect(matches([..."acao"], lettersOf("ação"), true)).toBe(true);
    expect(matches([..."sin"], lettersOf("sink"), false)).toBe(false);
  });
});

describe("tiles", () => {
  it("has one tile per letter, the same letters, and is stable for a seed", () => {
    const letters = lettersOf("ladder");
    const a = makeTiles(letters, hashSeed("w1"));
    expect(a.map((t) => t.letter).sort()).toEqual([...letters].sort());
    expect(a).toEqual(makeTiles(letters, hashSeed("w1")));
    expect(a.map((t) => t.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });
  it("is never in the correct order when another order exists", () => {
    const letters = lettersOf("abc");
    for (let seed = 0; seed < 200; seed += 1) {
      expect(makeTiles(letters, seed).map((t) => t.letter).join("")).not.toBe("abc");
    }
    expect(makeTiles(["a"], 1).map((t) => t.letter)).toEqual(["a"]);
    expect(makeTiles(["a", "a"], 1).map((t) => t.letter)).toEqual(["a", "a"]);
  });
  it("only the first eight tiles have shortcuts", () => {
    expect(tileShortcut(0)).toBe("1");
    expect(tileShortcut(7)).toBe("8");
    expect(tileShortcut(8)).toBeNull();
  });
});

describe("answering", () => {
  it("builds the answer from keyboard letters and completes correctly", () => {
    const { state, letters } = stateFor("sink");
    const done = type(state, "SINK");
    expect(typedLetters(done).join("")).toBe("sink"); // the tiles carry the answer's own letters
    expect(evaluate(done, letters, strict)).toBe("correct");
    expect(evaluate(type(state, "sin"), letters, strict)).toBe("incomplete");
  });
  it("ignores a letter that has no free tile, including a repeated one", () => {
    const { state } = stateFor("sink");
    expect(pickLetter(state, "z", strict)).toBeNull();
    const once = pickLetter(state, "s", strict)!;
    expect(pickLetter(once, "s", strict)).toBeNull();
  });
  it("handles repeated letters as separate tiles", () => {
    const { state, letters } = stateFor("ladder");
    expect(evaluate(type(state, "ladder"), letters, strict)).toBe("correct");
  });
  it("reports a wrong full-length answer and lets backspace fix it", () => {
    const { state, letters } = stateFor("sink");
    const wrong = type(state, "knis");
    expect(evaluate(wrong, letters, strict)).toBe("wrong");
    const fixed = backspace(backspace(backspace(backspace(wrong)!)!)!)!;
    expect(fixed.picked).toEqual([]);
    expect(backspace(fixed)).toBeNull();
    expect(evaluate(type(fixed, "sink"), letters, strict)).toBe("correct");
  });
  it("picks tiles by position and frees them on backspace", () => {
    const { state } = stateFor("abc");
    const one = pickTile(state, 1)!;
    expect(pickTile(one, 1)).toBeNull();
    expect(backspace(one)!.picked).toEqual([]);
    expect(pickTile(state, 9)).toBeNull();
  });
  it("accepts an unaccented key for an accented tile only when tolerant", () => {
    const { state } = stateFor("ação");
    expect(pickLetter(state, "c", strict)).toBeNull(); // no plain "c" tile exists
    expect(pickLetter(state, "a", strict)).not.toBeNull();
    const withoutAccent = type(state, "acao", strict);
    expect(typedLetters(withoutAccent)).toEqual(["a", "o"]); // "c" and the second "a" have no exact tile
    const typed = type(state, "acao", tolerant);
    expect(typedLetters(typed)).toEqual(["a", "ç", "ã", "o"]);
    expect(evaluate(typed, lettersOf("ação"), tolerant)).toBe("correct");
    expect(evaluate(typed, lettersOf("ação"), strict)).toBe("correct"); // the tiles carry the real letters
  });
});

describe("hints", () => {
  it("fills the next correct letter and counts the hint", () => {
    const { state, letters } = stateFor("sink");
    const one = hint(state, letters, strict)!;
    expect(typedLetters(one)).toEqual(["s"]);
    expect(one.hints).toBe(1);
    const two = hint(one, letters, strict)!;
    expect(typedLetters(two)).toEqual(["s", "i"]);
  });
  it("removes a wrong tail before giving the next letter", () => {
    const { state, letters } = stateFor("sink");
    const mixed = type(state, "sk");
    expect(typedLetters(mixed)).toEqual(["s", "k"]);
    const fixed = hint(mixed, letters, strict)!;
    expect(typedLetters(fixed)).toEqual(["s", "i"]);
  });
  it("is unavailable once the word is complete", () => {
    const { state, letters } = stateFor("at");
    const done = type(state, "at");
    expect(hint(done, letters, strict)).toBeNull();
  });
});

describe("display", () => {
  it("fills in spaces and punctuation as the letters before them are typed", () => {
    const { state } = stateFor("laundry folding");
    expect(displayText(state, "laundry folding")).toBe("");
    const partial = type(state, "laun");
    expect(displayText(partial, "laundry folding")).toBe("laun");
    const word = type(state, "laundry");
    expect(displayText(word, "laundry folding")).toBe("laundry ");
    const all = type(state, "laundryfolding");
    expect(displayText(all, "laundry folding")).toBe("laundry folding");
  });
});

describe("points and results", () => {
  it("gives full points for a clean answer and less for each hint, never below 1, none for giving up", () => {
    expect(wordPoints("correct", 0)).toBe(10);
    expect(wordPoints("hinted", 1)).toBe(7);
    expect(wordPoints("hinted", 3)).toBe(1);
    expect(wordPoints("hinted", 9)).toBe(1);
    expect(wordPoints("gave_up", 0)).toBe(0);
    expect(wordPoints("timeout", 2)).toBe(0);
    expect(wordPoints("wrong", 0)).toBe(10);
  });
  it("derives how a word ended", () => {
    expect(resultOf("answered", 0, 0)).toBe("correct");
    expect(resultOf("answered", 2, 0)).toBe("hinted");
    expect(resultOf("answered", 0, 3)).toBe("wrong");
    expect(resultOf("gave_up", 0, 0)).toBe("gave_up");
    expect(resultOf("timeout", 1, 1)).toBe("timeout");
  });
});
