/** Rules of the speed review game: time per question, lives, streaks and points. */

export const START_LIVES = 3;
export const MAX_LIVES = 5;
/** Correct answers in a row that earn an extra life. */
export const LIFE_EVERY = 15;
export const BASE_POINTS = 100;
export const SPEED_BONUS = 50;
/** Correct answers in a row that raise the multiplier by one. */
export const STREAK_STEP = 5;
export const MAX_MULTIPLIER = 5;
/** A correct answer this fast (in ms) is rated "easy" by the scheduler. */
export const FAST_MS = 3000;

/** Seconds to answer: 6 by default, 7 for a longer prompt, 8 for a very long one or a recording to listen to. */
export function questionSeconds(promptLength: number, listening: boolean): number {
  if (listening || promptLength > 50) return 8;
  return promptLength > 25 ? 7 : 6;
}

/** x1 for the first five correct answers in a row, x2 for the next five, and so on up to x5. */
export function multiplierFor(streakBefore: number): number {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(streakBefore / STREAK_STEP));
}

/** 100 points plus up to 50 for the time left, times the multiplier. */
export function pointsFor(streakBefore: number, remainingMs: number, totalMs: number): number {
  const left = totalMs <= 0 ? 0 : Math.min(1, Math.max(0, remainingMs / totalMs));
  return Math.round((BASE_POINTS + SPEED_BONUS * left) * multiplierFor(streakBefore));
}

export interface MissedWord {
  wordId: string;
  text: string;
  /** What the right answer was, to show on the summary. */
  answer: string;
  timedOut: boolean;
}

export interface GameState {
  lives: number;
  streak: number;
  bestStreak: number;
  score: number;
  correct: number;
  answered: number;
  missed: MissedWord[];
}

export const startGame = (): GameState => ({ lives: START_LIVES, streak: 0, bestStreak: 0, score: 0, correct: 0, answered: 0, missed: [] });

export const isOver = (state: GameState): boolean => state.lives <= 0;

export type Answer = { correct: true; remainingMs: number; totalMs: number } | { correct: false; word: MissedWord };

/** Applies one answer: points and streak for a right one, a lost life and a fresh start for a wrong one or a timeout. */
export function applyAnswer(state: GameState, answer: Answer): { state: GameState; points: number } {
  if (!answer.correct) {
    return {
      points: 0,
      state: { ...state, lives: Math.max(0, state.lives - 1), streak: 0, answered: state.answered + 1, missed: [...state.missed, answer.word] },
    };
  }
  const points = pointsFor(state.streak, answer.remainingMs, answer.totalMs);
  const streak = state.streak + 1;
  const extraLife = streak % LIFE_EVERY === 0;
  return {
    points,
    state: {
      ...state,
      lives: extraLife ? Math.min(MAX_LIVES, state.lives + 1) : state.lives,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      score: state.score + points,
      correct: state.correct + 1,
      answered: state.answered + 1,
    },
  };
}

export const accuracy = (state: GameState): number => (state.answered === 0 ? 0 : Math.round((state.correct / state.answered) * 100));
