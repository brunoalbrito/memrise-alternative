import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getApi, isDesktop } from "../../../shared/api";
import { mediaUrl } from "../../../shared/media/mediaStore";
import { useProgressStore, type Word } from "../../home";
import { resultOf, wordPoints, type WordResult } from "../model/points";
import { lettersOf } from "../model/text";
import { hashSeed, makeTiles } from "../model/tiles";
import {
  backspace as removeLetter,
  displayText,
  evaluate,
  hint as giveHint,
  pickLetter,
  pickTile,
  startWord,
  type Rules,
  type WordState,
} from "../model/word";

export type PracticeKind = "learn" | "classic" | "speed";
export type Phase = "answering" | "wrong" | "correct" | "revealed";

export const SPEED_SECONDS = 8;
const ADVANCE_DELAY_MS = 800;

export interface Totals {
  answered: number;
  correct: number;
  hints: number;
  points: number;
  skipped: number;
}

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** The accent setting of a course is not editable yet: answers must have the exact accents. */
const RULES: Rules = { accentTolerant: false };

/**
 * Runs one practice session: which word is on screen, what the learner typed, hints, feedback, points,
 * and recording every answer. Closing the screen never loses answers that were already given.
 */
export function usePracticeSession(courseId: string, kind: PracticeKind, planned: Word[], skipped: number) {
  // The list is fixed for the session even if the course is edited meanwhile.
  const [words] = useState<Word[]>(planned);
  const [skips, setSkips] = useState(0);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [state, setState] = useState<WordState>(() => stateFor(words[0]));
  const [totals, setTotals] = useState<Totals>({ answered: 0, correct: 0, hints: 0, points: 0, skipped });
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(0);
  const [remainingMs, setRemainingMs] = useState(SPEED_SECONDS * 1000);

  const word: Word | undefined = words[index];
  const answerLetters = useMemo(() => (word ? lettersOf(word.text) : []), [word]);
  const startedAt = useRef(Date.now());
  const sessionId = useRef<Promise<string | null> | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settled = useRef(false);

  function stateFor(target: Word | undefined): WordState {
    return startWord(target ? makeTiles(lettersOf(target.text), hashSeed(target.id)) : []);
  }

  // Start the session record once.
  useEffect(() => {
    if (!isDesktop() || words.length === 0) return;
    sessionId.current = getApi()
      .study.startSession(courseId, kind, words.length)
      .then((result) => (result.ok ? result.data : null))
      .catch(() => null);
  }, [courseId, kind, words.length]);

  const record = useCallback((target: Word, result: WordResult, current: WordState) => {
    const points = wordPoints(result, current.hints);
    const ok = result !== "gave_up" && result !== "timeout";
    setTotals((t) => ({
      ...t,
      answered: t.answered + 1,
      correct: t.correct + (ok ? 1 : 0),
      hints: t.hints + current.hints,
      points: t.points + points,
    }));
    const outcome = {
      wordId: target.id,
      result,
      hintsUsed: current.hints,
      attempts: current.attempts,
      elapsedMs: Math.max(0, Date.now() - startedAt.current),
      points,
    };
    void sessionId.current?.then((id) => (id ? getApi().study.answer(id, outcome) : null)).catch(() => null);
  }, []);

  const playAudio = (target: Word) => {
    const first = target.audio[0];
    if (!first || !isDesktop()) return;
    void new Audio(mediaUrl(first.id)).play().catch(() => undefined);
  };

  const goNext = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    if (index + 1 >= words.length) {
      setFinished(true);
      return;
    }
    const nextWord = words[index + 1];
    setIndex(index + 1);
    setState(stateFor(nextWord));
    setPhase("answering");
    setRemainingMs(SPEED_SECONDS * 1000);
    startedAt.current = Date.now();
    settled.current = false;
  }, [index, words]);

  // Close the session record when the session is over.
  useEffect(() => {
    if (!finished) return;
    void sessionId.current
      ?.then((id) => (id ? getApi().study.endSession(id, "completed") : null))
      .catch(() => null)
      .then(() => useProgressStore.getState().refresh());
  }, [finished]);

  const afterChange = (next: WordState) => {
    if (!word) return;
    setState(next);
    const outcome = evaluate(next, answerLetters, RULES);
    if (outcome === "correct") {
      settled.current = true;
      setPhase("correct");
      record(word, resultOf("answered", next.hints, next.attempts), next);
      playAudio(word);
      advanceTimer.current = setTimeout(goNext, prefersReducedMotion() ? 0 : ADVANCE_DELAY_MS);
    } else if (outcome === "wrong") {
      setState({ ...next, attempts: next.attempts + 1 });
      setPhase("wrong");
    } else {
      setPhase("answering");
    }
  };

  const busy = phase === "correct" || phase === "revealed" || finished || !word;

  const pickKey = (letter: string) => {
    if (busy) return;
    const next = pickLetter(state, letter, RULES);
    if (next) afterChange(next);
    else setShake((n) => n + 1);
  };
  const pickAt = (tileIndex: number) => {
    if (busy) return;
    // A word with digits has no number shortcuts; clicking a tile still works.
    const next = pickTile(state, tileIndex);
    if (next) afterChange(next);
  };
  const backspace = () => {
    if (busy) return;
    const next = removeLetter(state);
    if (next) {
      setState(next);
      setPhase("answering");
    }
  };
  const hint = () => {
    if (busy) return;
    const next = giveHint(state, answerLetters, RULES);
    if (next) afterChange(next);
  };

  const reveal = useCallback(
    (ending: "gave_up" | "timeout") => {
      if (!word || settled.current || phase === "correct" || phase === "revealed") return;
      settled.current = true;
      setPhase("revealed");
      record(word, resultOf(ending, state.hints, state.attempts), state);
      playAudio(word);
    },
    [word, phase, state, record],
  );
  const giveUp = () => {
    if (!busy) reveal("gave_up");
  };

  // Speed review: a countdown for every word.
  useEffect(() => {
    if (kind !== "speed" || busy) return;
    const timer = setInterval(() => {
      setRemainingMs((ms) => {
        if (ms <= 100) return 0;
        return ms - 100;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [kind, busy, phase, index]);
  useEffect(() => {
    if (kind === "speed" && remainingMs === 0 && !busy) reveal("timeout");
  }, [kind, remainingMs, busy, reveal]);

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  /** Ends the session early. Answers already given stay recorded. */
  const exit = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const answered = totals.answered > 0;
    void sessionId.current
      ?.then((id) => (id ? getApi().study.endSession(id, answered ? "completed" : "abandoned") : null))
      .catch(() => null)
      .then(() => useProgressStore.getState().refresh());
  };

  /** Marks the current word as ignored or long-term; it is left out of this and later sessions and the session moves on. */
  const mark = (flag: "ignored" | "longTerm") => {
    if (busy || !word) return;
    if (isDesktop()) void getApi().study.mark(courseId, word.id, flag, true).catch(() => null);
    setSkips((n) => n + 1);
    goNext();
  };

  return {
    words,
    index,
    total: words.length,
    word,
    state,
    phase,
    finished,
    totals,
    done: totals.answered + skips,
    mark,
    shake,
    remainingMs,
    display: word ? (phase === "revealed" ? word.text : displayText(state, word.text)) : "",
    letterCount: answerLetters.length,
    hasDigits: answerLetters.some((letter) => /\p{N}/u.test(letter)),
    pickKey,
    pickAt,
    backspace,
    hint,
    giveUp,
    next: goNext,
    exit,
  };
}
