import { describe, expect, it } from "vitest";
import {
  accuracy,
  applyAnswer,
  isListening,
  isOver,
  LIFE_EVERY,
  MAX_LIVES,
  multiplierFor,
  pointsFor,
  questionSeconds,
  rotateKinds,
  SPEED_ORDER,
  startGame,
  type GameState,
  type MissedWord,
} from "../../src/features/practice/model/speedGame";

const miss = (id = "w", timedOut = false): MissedWord => ({ wordId: id, text: id, answer: id, timedOut });
const right = (state: GameState, remainingMs = 6000, totalMs = 6000) => applyAnswer(state, { correct: true, remainingMs, totalMs });
const wrong = (state: GameState, id?: string) => applyAnswer(state, { correct: false, word: miss(id) });
const streakOf = (n: number, state = startGame()): GameState => {
  let s = state;
  for (let i = 0; i < n; i += 1) s = right(s).state;
  return s;
};

describe("question time", () => {
  it("is 6 seconds, 7 for a longer prompt, 8 for a very long one or a recording", () => {
    expect(questionSeconds(5, false)).toBe(6);
    expect(questionSeconds(25, false)).toBe(6);
    expect(questionSeconds(26, false)).toBe(7);
    expect(questionSeconds(50, false)).toBe(7);
    expect(questionSeconds(51, false)).toBe(8);
    expect(questionSeconds(0, true)).toBe(8);
  });
});

describe("points and multiplier", () => {
  it("grows by one for every five correct answers in a row, up to five", () => {
    expect([0, 4, 5, 9, 10, 19, 20, 24, 25, 100].map(multiplierFor)).toEqual([1, 1, 2, 2, 3, 4, 5, 5, 5, 5]);
  });
  it("gives 100 plus up to 50 for the time left, times the multiplier", () => {
    expect(pointsFor(0, 6000, 6000)).toBe(150);
    expect(pointsFor(0, 3000, 6000)).toBe(125);
    expect(pointsFor(0, 0, 6000)).toBe(100);
    expect(pointsFor(5, 6000, 6000)).toBe(300);
    expect(pointsFor(25, 6000, 6000)).toBe(750);
    expect(pointsFor(0, 9999, 6000)).toBe(150); // never more than the full bonus
    expect(pointsFor(0, -5, 6000)).toBe(100);
    expect(pointsFor(0, 5, 0)).toBe(100);
  });
});

describe("a game", () => {
  it("starts with three lives and nothing else", () => {
    expect(startGame()).toEqual({ lives: 3, streak: 0, bestStreak: 0, score: 0, correct: 0, answered: 0, missed: [] });
  });
  it("adds points and a streak for right answers", () => {
    const a = right(startGame());
    expect(a.points).toBe(150);
    expect(a.state).toMatchObject({ score: 150, streak: 1, bestStreak: 1, correct: 1, answered: 1, lives: 3 });
    const b = right(a.state, 3000, 6000);
    expect(b.points).toBe(125);
    expect(b.state.score).toBe(275);
  });
  it("loses a life, the streak and the multiplier on a wrong answer, and remembers the word", () => {
    const run = streakOf(7);
    expect(multiplierFor(run.streak)).toBe(2);
    const a = wrong(run, "w9");
    expect(a.points).toBe(0);
    expect(a.state).toMatchObject({ lives: 2, streak: 0, bestStreak: 7, answered: 8, correct: 7 });
    expect(a.state.missed).toEqual([miss("w9")]);
    expect(multiplierFor(a.state.streak)).toBe(1);
    expect(a.state.score).toBe(run.score);
  });
  it("ends when the last life is lost, never going below zero", () => {
    let s = startGame();
    for (let i = 0; i < 3; i += 1) {
      expect(isOver(s)).toBe(false);
      s = wrong(s).state;
    }
    expect(isOver(s)).toBe(true);
    expect(wrong(s).state.lives).toBe(0);
  });
  it("gives an extra life for every 15 right answers in a row, up to five, and keeps the streak going", () => {
    const afterFourteen = streakOf(LIFE_EVERY - 1);
    expect(afterFourteen.lives).toBe(3);
    const afterFifteen = right(afterFourteen).state;
    expect(afterFifteen).toMatchObject({ lives: 4, streak: 15 });
    expect(streakOf(30).lives).toBe(5);
    expect(streakOf(45).lives).toBe(MAX_LIVES);
    expect(streakOf(60, startGame()).lives).toBe(MAX_LIVES);
    // A mistake resets the count towards the next life.
    const reset = streakOf(10, wrong(streakOf(14)).state);
    expect(reset.lives).toBe(2);
  });
  it("computes accuracy", () => {
    expect(accuracy(startGame())).toBe(0);
    expect(accuracy(wrong(streakOf(3)).state)).toBe(75);
  });
});

describe("question kinds", () => {
  it("cycles through picture, recording and meaning questions, then their reverses", () => {
    const all = [...SPEED_ORDER];
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => rotateKinds(all, i)[0])).toEqual(["image-to-word", "audio-to-word", "meaning-to-word", "word-to-image", "word-to-audio", "word-to-meaning", "image-to-word"]);
  });
  it("only uses kinds that are on, and keeps every one of them as a fallback", () => {
    expect(rotateKinds(["word-to-meaning", "image-to-word", "type"], 1)).toEqual(["word-to-meaning", "image-to-word"]);
    expect(rotateKinds(["type", "audio-to-type"], 0)).toEqual([]);
    expect(rotateKinds(["audio-to-word"], 7)).toEqual(["audio-to-word"]);
  });
  it("gives questions that play a recording more time", () => {
    expect(isListening("audio-to-word")).toBe(true);
    expect(isListening("word-to-audio")).toBe(true);
    expect(isListening("image-to-word")).toBe(false);
    expect(isListening("word-to-meaning")).toBe(false);
  });
});
