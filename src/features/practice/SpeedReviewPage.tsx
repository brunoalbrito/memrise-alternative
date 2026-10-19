import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { playAudio } from "../../shared/media/playAudio";
import { IconButton } from "../../shared/ui/IconButton";
import { BoltIcon, CloseIcon, HeartIcon, TimerIcon } from "../../shared/ui/icons";
import { languages, useCourse } from "../home";
import { ChoiceExercise } from "./components/ChoiceExercise";
import { ExitDialog } from "./components/ExitDialog";
import { SpeedSummary } from "./components/SpeedSummary";
import { usePlanned, type Planned } from "./hooks/usePlanned";
import { useSpeedGame } from "./hooks/useSpeedGame";
import { multiplierFor, START_LIVES, MAX_LIVES } from "./model/speedGame";
import { useExerciseSettings } from "./store/exerciseSettings";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Speed review: a timed multiple-choice game over the words that are due. */
export function SpeedReviewPage() {
  const { id = "" } = useParams();
  const course = useCourse(id);
  const [round, setRound] = useState(0);
  const planned = usePlanned(id, "speed", round, null);
  const backPath = `/course/${id}`;

  if (!course) {
    return (
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-headline-medium text-on-surface">Course not found</h1>
        <Link to="/" className="text-label-large font-medium text-primary underline">
          Back to Home
        </Link>
      </main>
    );
  }
  if (!planned) {
    return (
      <main aria-busy="true" className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-body-large text-on-surface-variant">Getting your words ready…</p>
      </main>
    );
  }
  return <Game key={`${id}:${round}`} courseId={id} title={course.title} planned={planned} backPath={backPath} languageId={course.teachingLanguageId} onAgain={() => setRound((n) => n + 1)} />;
}

interface GameProps {
  courseId: string;
  title: string;
  planned: Planned;
  backPath: string;
  languageId?: string;
  onAgain: () => void;
}

function Game({ courseId, title, planned, backPath, languageId, onAgain }: GameProps) {
  const navigate = useNavigate();
  const enabled = useExerciseSettings((state) => state.enabled);
  const g = useSpeedGame(courseId, planned.words, { pool: planned.pool, states: planned.states, enabled });
  const [exiting, setExiting] = useState(false);
  const latest = useRef({ g, exiting });
  useEffect(() => {
    latest.current = { g, exiting };
  });
  const lang = languages.find((l) => l.id === languageId)?.id.split("-")[0];
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { g: current, exiting: leaving } = latest.current;
      if (leaving || current.finished || document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setExiting(true);
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        current.answer(Number(event.key) - 1);
      } else if ((event.key === "r" || event.key === "R") && !event.ctrlKey && !event.metaKey && current.question?.exercise.kind === "audio-to-word") {
        const recording = current.question.word.audio[0];
        if (recording) playAudio(recording.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A recording question plays as soon as it appears.
  const recordingId = g.question?.exercise.kind === "audio-to-word" ? g.question.word.audio[0]?.id : undefined;
  useEffect(() => {
    if (recordingId && !g.finished) playAudio(recordingId);
  }, [g.index, recordingId, g.finished]);

  const header = (
    <header className="relative z-10 flex items-center gap-3 bg-primary-container px-4 py-3 text-on-primary-container">
      <TimerIcon className="size-7" />
      <h1 className="min-w-0 flex-1 truncate text-title-large font-medium">
        Speed review <span className="font-normal opacity-80">· {title}</span>
      </h1>
      <IconButton aria-label="Close" onClick={() => (g.finished ? navigate(backPath) : setExiting(true))}>
        <CloseIcon />
      </IconButton>
    </header>
  );

  if (g.finished) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <SpeedSummary title={title} game={g.game} result={g.result} backPath={backPath} leftOut={g.leftOut} onAgain={onAgain} />
      </div>
    );
  }

  if (!g.question) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          {planned.words.length > 0 ? (
            <>
              <h1 className="text-headline-medium text-on-surface">Speed review needs more words</h1>
              <p className="text-body-large text-on-surface-variant">
                The game asks multiple-choice questions, so it needs at least four words with a picture, a meaning or a recording. Add more words, or check which exercise types are on.
              </p>
            </>
          ) : planned.empty === "none" || planned.empty === null ? (
            <>
              <h1 className="text-headline-medium text-on-surface">Nothing to review yet</h1>
              <p className="text-body-large text-on-surface-variant">Learn some words first, then come back to race the clock.</p>
            </>
          ) : (
            <>
              <h1 className="text-headline-medium text-on-surface">All caught up</h1>
              <p className="text-body-large text-on-surface-variant">{planned.empty}</p>
            </>
          )}
          <Link to={backPath} className="text-label-large font-medium text-primary underline">
            Back to the course
          </Link>
        </main>
      </div>
    );
  }

  const { question, game } = g;
  const fraction = Math.min(1, Math.max(0, g.remainingMs / question.totalMs));
  const low = fraction < 0.34;
  // The screen turns red as time runs out; with reduced motion it changes in coarse steps.
  const tint = (1 - fraction) ** 2 * 0.35;
  const tintShown = reduced ? Math.round(tint * 5) / 5 : tint;
  const seconds = Math.ceil(g.remainingMs / 1000);
  const multiplier = multiplierFor(game.streak);
  const asked = g.phase !== "asking";

  const feedback =
    g.phase === "right" ? (
      <p className="rounded-m3-sm bg-primary-container px-3 py-2 text-body-medium text-on-primary-container">Correct! +{g.lastPoints} points</p>
    ) : g.phase === "wrong" ? (
      <p className="rounded-m3-sm bg-error-container px-3 py-2 text-body-medium text-on-error-container">{g.timedOut ? "Time's up!" : "Not quite."} The right answer is highlighted.</p>
    ) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-error" style={{ opacity: tintShown }} data-testid="red-tint" />
      {header}
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="img" aria-label={`${game.lives} ${game.lives === 1 ? "life" : "lives"} left`} className="flex items-center gap-1 text-error">
            {Array.from({ length: Math.max(START_LIVES, game.lives, 0) > MAX_LIVES ? MAX_LIVES : Math.max(START_LIVES, game.lives) }, (_, i) => (
              <HeartIcon key={i} className={`size-7 ${i < game.lives ? "" : "opacity-25"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              aria-label={`Streak ${game.streak}, multiplier ${multiplier}`}
              className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-label-large font-medium text-on-secondary-container"
            >
              <BoltIcon className="size-4" />
              {game.streak} in a row · x{multiplier}
            </div>
            <div aria-live="polite" aria-label="Score" className="min-w-20 rounded-full bg-surface-container-high px-4 py-1 text-center text-label-large font-medium">
              {game.score.toLocaleString()}
            </div>
          </div>
        </div>

        <div
          role="timer"
          aria-label="Time left"
          aria-valuetext={`${seconds} ${seconds === 1 ? "second" : "seconds"} left`}
          className="mt-4 h-4 overflow-hidden rounded-full bg-surface-variant"
        >
          <div className={`h-full rounded-full ${low ? "bg-error" : "bg-primary"}`} style={{ width: `${fraction * 100}%` }} />
        </div>
        <p className="mt-1 text-right text-label-medium tabular-nums text-on-surface-variant">
          {seconds}s · question {g.index + 1} of {g.questions.length}
        </p>

        <div className="mt-4 grid">
          <ChoiceExercise
            key={question.word.id + g.index}
            exercise={question.exercise}
            word={question.word}
            wrong={g.phase === "wrong" && g.chosen !== null && g.chosen !== question.exercise.correct ? [g.chosen] : []}
            showAnswer={asked}
            disabled={asked}
            showShortcuts
            lang={lang}
            onPick={g.answer}
            onAudioError={() => undefined}
            feedback={feedback}
          />
        </div>
      </main>
      {exiting && (
        <ExitDialog
          onContinue={() => setExiting(false)}
          onEnd={() => {
            g.exit();
            navigate(backPath);
          }}
        />
      )}
    </div>
  );
}
