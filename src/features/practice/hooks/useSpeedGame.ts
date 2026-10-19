import { useCallback, useEffect, useRef, useState } from "react";
import { getApi, isDesktop } from "../../../shared/api";
import { useProgressStore, type Word } from "../../home";
import { chooseExercise, isChoiceKind, type Exercise } from "../model/exercises";
import { hashSeed } from "../model/tiles";
import { applyAnswer, isOver, questionSeconds, startGame, type GameState } from "../model/speedGame";
import type { PracticeContext } from "./usePracticeSession";

export type SpeedPhase = "asking" | "right" | "wrong";

export interface SpeedQuestion {
  word: Word;
  exercise: Exercise;
  totalMs: number;
}

export interface SpeedResult {
  best: number | null;
  improved: boolean;
}

const TICK_MS = 50;
const PAUSE_RIGHT_MS = 350;
const PAUSE_WRONG_MS = 900;

/** Seconds a question allows: longer prompts and recordings get more time. */
function totalMsFor(word: Word, exercise: Exercise): number {
  const listening = exercise.kind === "audio-to-word";
  const prompt = exercise.kind === "meaning-to-word" ? word.meaning : exercise.kind === "image-to-word" ? "" : word.text;
  return questionSeconds(prompt.trim().length, listening) * 1000;
}

/**
 * Runs a speed review game: only choice questions, a real-time clock for each, lives, streaks and score.
 * Words that cannot be asked as a choice are left out. Every answer is recorded for the schedule.
 */
export function useSpeedGame(courseId: string, planned: Word[], context: PracticeContext) {
  const [{ questions, leftOut }] = useState(() => {
    const salt = Date.now() % 1_000_003;
    const levelOf = new Map(context.pool.map((p) => [p.word.id, p.levelId]));
    const choices = context.enabled.filter(isChoiceKind);
    const made: SpeedQuestion[] = [];
    for (const word of planned) {
      const exercise = chooseExercise({
        word,
        levelId: levelOf.get(word.id) ?? "",
        pool: context.pool,
        stage: "review",
        session: "speed",
        enabled: choices,
        seed: hashSeed(word.id) ^ salt,
      });
      // Typing is never used in the game: the word is left out instead.
      if (isChoiceKind(exercise.kind)) made.push({ word, exercise, totalMs: totalMsFor(word, exercise) });
    }
    return { questions: made, leftOut: planned.length - made.length };
  });

  const [index, setIndex] = useState(0);
  const [game, setGame] = useState<GameState>(startGame);
  const [phase, setPhase] = useState<SpeedPhase>("asking");
  const [chosen, setChosen] = useState<number | null>(null);
  const [lastPoints, setLastPoints] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<SpeedResult | null>(null);
  const question: SpeedQuestion | undefined = questions[index];
  const [remainingMs, setRemainingMs] = useState(question?.totalMs ?? 0);

  const deadline = useRef(0);
  const locked = useRef(false);
  const sessionId = useRef<Promise<string | null> | null>(null);
  const nextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The first question's clock starts when the game appears.
  useEffect(() => {
    deadline.current = performance.now() + (questions[0]?.totalMs ?? 0);
  }, [questions]);
  const gameRef = useRef(game);
  useEffect(() => {
    gameRef.current = game;
  });

  useEffect(() => {
    if (!isDesktop() || questions.length === 0) return;
    sessionId.current = getApi()
      .study.startSession(courseId, "speed", questions.length)
      .then((r) => (r.ok ? r.data : null))
      .catch(() => null);
  }, [courseId, questions.length]);

  const finish = useCallback(
    (final: GameState) => {
      setFinished(true);
      void (async () => {
        const id = await sessionId.current?.catch(() => null);
        if (isDesktop()) {
          const saved = await getApi().study.saveSpeedScore(courseId, final.score).catch(() => null);
          if (saved?.ok) setResult(saved.data);
          if (id) await getApi().study.endSession(id, final.answered > 0 ? "completed" : "abandoned").catch(() => null);
          await useProgressStore.getState().refresh();
        } else setResult({ best: final.score, improved: final.score > 0 });
      })();
    },
    [courseId],
  );

  const advance = useCallback(
    (after: GameState) => {
      if (isOver(after) || index + 1 >= questions.length) {
        finish(after);
        return;
      }
      const next = questions[index + 1]!;
      setIndex(index + 1);
      setPhase("asking");
      setChosen(null);
      setTimedOut(false);
      setRemainingMs(next.totalMs);
      deadline.current = performance.now() + next.totalMs;
      locked.current = false;
    },
    [finish, index, questions],
  );

  /** Settles the current question once: a right option, a wrong one, or no answer in time. */
  const settle = useCallback(
    (pick: number | null) => {
      if (!question || locked.current || finished) return;
      locked.current = true;
      const remaining = Math.max(0, deadline.current - performance.now());
      const correct = pick !== null && pick === question.exercise.correct;
      const { word } = question;
      const outcome = applyAnswer(
        gameRef.current,
        correct
          ? { correct: true, remainingMs: remaining, totalMs: question.totalMs }
          : { correct: false, word: { wordId: word.id, text: word.text, answer: word.meaning.trim(), timedOut: pick === null } },
      );
      setGame(outcome.state);
      setChosen(pick);
      setTimedOut(pick === null);
      setLastPoints(outcome.points);
      setPhase(correct ? "right" : "wrong");
      setRemainingMs(remaining);
      void sessionId.current
        ?.then((id) =>
          id
            ? getApi().study.answer(id, {
                wordId: word.id,
                exercise: question.exercise.kind,
                result: correct ? "correct" : pick === null ? "timeout" : "gave_up",
                hintsUsed: 0,
                attempts: correct ? 0 : 1,
                elapsedMs: Math.round(question.totalMs - remaining),
                points: outcome.points,
              })
            : null,
        )
        .catch(() => null);
      nextTimer.current = setTimeout(() => advance(outcome.state), correct ? PAUSE_RIGHT_MS : PAUSE_WRONG_MS);
    },
    [advance, finished, question],
  );

  // The clock runs on real time, so it cannot be stretched by a slow screen or a sleeping computer.
  useEffect(() => {
    if (phase !== "asking" || finished || !question) return;
    const timer = setInterval(() => {
      const left = Math.max(0, deadline.current - performance.now());
      setRemainingMs(left);
      if (left <= 0) settle(null);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase, finished, question, settle]);

  useEffect(
    () => () => {
      if (nextTimer.current) clearTimeout(nextTimer.current);
    },
    [],
  );

  /** Leaves the game early; answers given so far stay recorded and the score counts. */
  const exit = () => {
    if (nextTimer.current) clearTimeout(nextTimer.current);
    locked.current = true;
    void (async () => {
      const id = await sessionId.current?.catch(() => null);
      if (id) await getApi().study.endSession(id, gameRef.current.answered > 0 ? "completed" : "abandoned").catch(() => null);
      await useProgressStore.getState().refresh();
    })();
  };

  return {
    questions,
    leftOut,
    index,
    question,
    game,
    phase,
    chosen,
    lastPoints,
    timedOut,
    remainingMs,
    finished,
    result,
    answer: (i: number) => settle(i),
    exit,
  };
}
