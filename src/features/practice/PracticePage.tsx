import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { getApi, isDesktop } from "../../shared/api";
import { Button } from "../../shared/ui/Button";
import { IconButton } from "../../shared/ui/IconButton";
import { BackspaceIcon, BoltIcon, CloseIcon, HelpIcon, KeyboardIcon, RemoveCircleIcon, SparkleIcon, TuneIcon, WaterDropIcon } from "../../shared/ui/icons";
import { languages, useCourse, useCourseLevels, wordHasText, type Word } from "../home";
import { ExerciseSettingsDialog } from "./components/ExerciseSettingsDialog";
import { ExitDialog } from "./components/ExitDialog";
import { ChoiceExercise } from "./components/ChoiceExercise";
import { LetterTile } from "./components/LetterTile";
import { SessionSummary } from "./components/SessionSummary";
import { WordClue } from "./components/WordClue";
import { SPEED_SECONDS, usePracticeSession, type PracticeKind } from "./hooks/usePracticeSession";
import { SESSION_SIZE } from "./model/queue";
import { hasPrompt, type PoolWord } from "./model/exercises";
import { useExerciseSettings } from "./store/exerciseSettings";
import { playAudio } from "../../shared/media/playAudio";
import { tileShortcut } from "./model/tiles";
import { isUsed } from "./model/word";

const SHORTCUTS_KEY = "membetter.practice.shortcuts";
const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

function readShortcuts(): boolean {
  try {
    return localStorage.getItem(SHORTCUTS_KEY) !== "0";
  } catch {
    return true;
  }
}

interface Planned {
  words: Word[];
  skipped: number;
  /** Every word of the course, used for the wrong options of choice exercises. */
  pool: PoolWord[];
  /** Card state of each planned word. */
  states: Record<string, number>;
  /** Why there is nothing to practice, shown instead of the screen. */
  empty: string | null;
}

const formatDue = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });

/** Chooses the words of a session: new words to learn, or words that are due (desktop), in the order of the course. */
function usePlanned(courseId: string, kind: PracticeKind, round: number, levelId: string | null): Planned | null {
  const allLevels = useCourseLevels(courseId);
  // A session can be limited to one level (from the level page).
  const levels = useMemo(() => (levelId ? allLevels.filter((level) => level.id === levelId) : allLevels), [allLevels, levelId]);
  const [result, setResult] = useState<{ key: string; planned: Planned } | null>(null);
  const key = `${courseId}:${kind}:${levelId ?? ""}:${round}`;
  const candidates = useMemo(() => {
    const all = levels.flatMap((level) => level.words).filter(wordHasText);
    const pool: PoolWord[] = allLevels.flatMap((level) => level.words.filter(wordHasText).map((word) => ({ word, levelId: level.id })));
    return { usable: all.filter(hasPrompt), skipped: all.length - all.filter(hasPrompt).length, pool };
  }, [levels, allLevels]);
  const latest = useRef(candidates);
  useEffect(() => {
    latest.current = candidates;
  });

  useEffect(() => {
    let cancelled = false;
    const { usable, skipped, pool } = latest.current;
    const byId = new Map(usable.map((w) => [w.id, w]));
    const done = (value: Planned) => {
      if (!cancelled) setResult({ key, planned: value });
    };
    if (!isDesktop()) {
      done({ words: usable.slice(0, SESSION_SIZE), skipped, pool, states: {}, empty: usable.length === 0 ? "none" : null });
      return;
    }
    getApi()
      .study.plan(courseId, kind, usable.map((w) => w.id))
      .then((result) => {
        if (!result.ok) return done({ words: [], skipped, pool, states: {}, empty: "Your progress could not be read. Try again." });
        const words = result.data.wordIds.flatMap((id) => byId.get(id) ?? []);
        let empty: string | null = null;
        if (words.length === 0) {
          if (usable.length === 0) empty = "none";
          else if (kind === "learn") {
            empty = result.data.newLeft === 0 ? "You have learned all the new words planned for today. Come back tomorrow, or raise the daily limit in the course options." : "There are no new words left in this course. Try a review.";
          } else {
            empty = result.data.nextDueAt ? `Nothing to review right now. The next words are due ${formatDue(result.data.nextDueAt)}.` : "Nothing to review yet. Learn some new words first.";
          }
        }
        done({ words, skipped, pool, states: result.data.states, empty });
      })
      .catch(() => done({ words: [], skipped, pool, states: {}, empty: "Your progress could not be read. Try again." }));
    return () => {
      cancelled = true;
    };
  }, [courseId, kind, round, key]);

  // A result planned for another course, kind or round is never shown.
  return result?.key === key ? result.planned : null;
}

export function PracticePage({ kind }: { kind: PracticeKind }) {
  const { id = "" } = useParams();
  const course = useCourse(id);
  const [round, setRound] = useState(0);
  const [search] = useSearchParams();
  const levelId = search.get("level");
  const planned = usePlanned(id, kind, round, levelId);
  const levelIndex = useCourseLevels(id).findIndex((level) => level.id === levelId);
  const backPath = levelId && levelIndex >= 0 ? `/course/${id}/levels/${levelIndex + 1}` : `/course/${id}`;

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
        <p className="text-body-large text-on-surface-variant">Preparing your session…</p>
      </main>
    );
  }
  // A new key restarts the session ("Practice again" plans it again).
  return (
    <Session
      backPath={backPath}
      key={`${id}:${kind}:${levelId ?? ""}:${round}`}
      courseId={id}
      title={course.title}
      kind={kind}
      planned={planned}
      languageId={course.teachingLanguageId}
      onAgain={() => {
        setRound((n) => n + 1);
      }}
    />
  );
}

interface SessionProps {
  courseId: string;
  /** Where leaving the session goes: the course, or the level it was started from. */
  backPath: string;
  title: string;
  kind: PracticeKind;
  planned: Planned;
  languageId?: string;
  onAgain: () => void;
}

function Session({ courseId, backPath, title, kind, planned, languageId, onAgain }: SessionProps) {
  const navigate = useNavigate();
  const enabled = useExerciseSettings((state) => state.enabled);
  const s = usePracticeSession(courseId, kind, planned.words, planned.skipped, { pool: planned.pool, states: planned.states, enabled });
  const [showShortcuts, setShowShortcuts] = useState(readShortcuts);
  const [exiting, setExiting] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef({ s, exiting });
  useEffect(() => {
    latest.current = { s, exiting };
  });
  const lang = languages.find((l) => l.id === languageId)?.id.split("-")[0];

  const toggleShortcuts = () => {
    const next = !showShortcuts;
    setShowShortcuts(next);
    try {
      localStorage.setItem(SHORTCUTS_KEY, next ? "1" : "0");
    } catch {
      /* the choice only lasts for this session */
    }
  };

  // Keyboard handling for the whole screen. The input only displays what was typed.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const { s: current, exiting: leaving } = latest.current;
      if (leaving || current.finished || document.querySelector("dialog[open]")) return;
      const mod = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        event.preventDefault();
        setExiting(true);
        return;
      }
      if (mod && event.key === "Enter") {
        event.preventDefault();
        current.giveUp();
        return;
      }
      if (event.key === "Enter") {
        if (current.phase === "revealed") {
          event.preventDefault();
          current.next();
        }
        return;
      }
      // Replay: R in choices; Alt+R when typing (plain R is a letter there).
      const replayKey = current.exercise?.kind === "audio-to-word" ? !mod && !event.altKey && (event.key === "r" || event.key === "R") : current.exercise?.kind === "audio-to-type" && event.altKey && !mod && event.code === "KeyR";
      if (replayKey) {
        event.preventDefault();
        const recording = current.word?.audio[0];
        if (recording) playAudio(recording.id, current.audioFailed);
        return;
      }
      if (current.isChoice) {
        // Choice exercises: keys 1 to 4 pick an option; nothing else is typed.
        if (!mod && !event.altKey && /^[1-4]$/.test(event.key)) {
          event.preventDefault();
          current.choose(Number(event.key) - 1);
        }
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        current.backspace();
        return;
      }
      if (mod) return;
      if (event.altKey && event.code === "KeyH") {
        event.preventDefault();
        current.hint();
        return;
      }
      if (event.altKey) return;
      if (/^[1-8]$/.test(event.key) && !current.hasDigits) {
        event.preventDefault();
        current.pickAt(Number(event.key) - 1);
        return;
      }
      if (event.key.length !== 1 || event.key === " ") return;
      // "h" asks for a hint only when the input is not the focused element; in the input it is a letter.
      const inInput = document.activeElement === inputRef.current;
      if (!inInput && (event.key === "h" || event.key === "H")) {
        event.preventDefault();
        current.hint();
        return;
      }
      event.preventDefault();
      current.pickKey(event.key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [s.index, s.state.picked.length, s.phase]);

  // A listening exercise plays its recording as soon as it appears.
  const listeningKind = s.exercise?.kind === "audio-to-word" || s.exercise?.kind === "audio-to-type";
  const recordingId = s.word?.audio[0]?.id;
  const { audioFailed } = s;
  useEffect(() => {
    if (listeningKind && recordingId && !s.finished) playAudio(recordingId, audioFailed);
    // Play once per word (the exercise is fixed for the word); replacing the exercise after a failure must not replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.index, listeningKind, recordingId]);

  const header = (
    <header className="flex items-center gap-3 bg-primary-container px-4 py-3 text-on-primary-container">
      <WaterDropIcon className="size-7" />
      <h1 className="min-w-0 flex-1 truncate text-title-large font-medium underline decoration-2 underline-offset-4">{title}</h1>
      <IconButton aria-label="Exercise types" onClick={() => setChoosing(true)}>
        <TuneIcon />
      </IconButton>
      <IconButton aria-label="Show keyboard shortcuts" aria-pressed={showShortcuts} onClick={toggleShortcuts}>
        <KeyboardIcon />
      </IconButton>
      <IconButton aria-label="Close" onClick={() => (s.finished ? navigate(backPath) : setExiting(true))}>
        <CloseIcon />
      </IconButton>
    </header>
  );

  if (s.finished) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <SessionSummary backPath={backPath} title={title} totals={s.totals} onAgain={onAgain} />
      </div>
    );
  }

  if (!s.word) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          {planned.empty === "none" || planned.empty === null ? (
            <>
              <h1 className="text-headline-medium text-on-surface">Nothing to practice yet</h1>
              <p className="text-body-large text-on-surface-variant">Add words with a picture, meaning or example to this course first.</p>
              <Link to={`/course/${courseId}/edit`} className="text-label-large font-medium text-primary underline">
                Edit course
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-headline-medium text-on-surface">{kind === "learn" ? "No new words for now" : "All caught up"}</h1>
              <p className="text-body-large text-on-surface-variant">{planned.empty}</p>
              <Link to={backPath} className="text-label-large font-medium text-primary underline">
                Back to the course
              </Link>
            </>
          )}
        </main>
      </div>
    );
  }

  const busy = s.phase === "correct" || s.phase === "revealed";
  const banner =
    s.phase === "correct"
      ? { text: "Correct!", cls: "bg-primary-container text-on-primary-container" }
      : s.phase === "wrong"
        ? { text: s.isChoice ? "Not quite. Try another." : "Not quite. Fix it or ask for a hint.", cls: "bg-error-container text-on-error-container" }
        : s.phase === "revealed"
          ? { text: `The word is “${s.word.text}”. Press Enter to continue.`, cls: "bg-tertiary-container text-on-tertiary-container" }
          : null;

  return (
    <div className="min-h-screen bg-surface">
      {header}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center gap-4">
          <div
            role="progressbar"
            aria-label="Session progress"
            aria-valuemin={0}
            aria-valuemax={s.total}
            aria-valuenow={s.done}
            aria-valuetext={`${s.done} of ${s.total}`}
            className="h-8 flex-1 overflow-hidden rounded-full bg-surface-variant"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(s.done / s.total) * 100}%` }} />
          </div>
          <div aria-live="polite" aria-label="Points" className="min-w-14 rounded-full bg-surface-container-high px-4 py-1 text-center text-label-large font-medium">
            {s.totals.points}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
          {s.isChoice && s.exercise ? (
            <ChoiceExercise
              key={s.word.id}
              exercise={s.exercise}
              word={s.word}
              wrong={s.wrongChoices}
              showAnswer={busy}
              disabled={busy}
              showShortcuts={showShortcuts}
              lang={lang}
              onPick={s.choose}
              onAudioError={s.audioFailed}
              feedback={
                <>
                  {banner && <p className={`rounded-m3-sm px-3 py-2 text-body-medium ${banner.cls}`}>{banner.text}</p>}
                  {s.audioProblem && <p className="mt-2 text-body-medium text-error">This recording could not be played.</p>}
                </>
              }
            />
          ) : (
            <>
          <WordClue key={s.word.id} word={s.word} listening={s.exercise?.kind === "audio-to-type"} onAudioError={s.audioFailed} />

          <div>
            <label htmlFor="practice-word" className="text-label-large font-medium text-on-surface">
              WORD
            </label>
            <input
              ref={inputRef}
              id="practice-word"
              value={s.display}
              onChange={() => undefined}
              readOnly={busy}
              lang={lang}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={s.word.text.length}
              aria-describedby="practice-feedback"
              className={`mt-1 h-14 w-full rounded-m3-md border-2 bg-surface-container-highest px-4 text-headline-medium text-on-surface focus:outline-none ${
                s.phase === "wrong" ? "border-error" : "border-primary"
              } ${s.shake % 2 === 1 ? "motion-safe:animate-pulse" : ""}`}
            />
            <div id="practice-feedback" role="status" aria-live="polite" className="mt-2 min-h-10">
              {banner && <p className={`rounded-m3-sm px-3 py-2 text-body-medium ${banner.cls}`}>{banner.text}</p>}
              {s.audioProblem && <p className="mt-2 text-body-medium text-error">This recording could not be played.</p>}
            </div>

            <div className="mt-3 flex flex-wrap items-start gap-2" role="group" aria-label="Letters">
              {s.state.tiles.map((tile) => (
                <LetterTile
                  key={tile.index}
                  letter={tile.letter}
                  shortcut={s.hasDigits ? null : tileShortcut(tile.index)}
                  showShortcut={showShortcuts}
                  used={isUsed(s.state, tile.index)}
                  disabled={busy}
                  onPick={() => s.pickAt(tile.index)}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="tonal" icon={<SparkleIcon className="size-5" />} onClick={s.hint} disabled={busy}>
                Hint{showShortcuts && <span aria-hidden="true" className="ml-1 text-label-medium opacity-70">H</span>}
              </Button>
              <Button variant="tonal" icon={<BackspaceIcon className="size-5" />} onClick={s.backspace} disabled={busy} aria-label="Backspace">
                <span className="sr-only">Backspace</span>
              </Button>
            </div>
          </div>
            </>
          )}

          <div className="flex flex-col items-center gap-3 md:w-28">
            {s.phase === "revealed" ? (
              <Button variant="filled" onClick={s.next} className="h-auto w-full flex-col py-4">
                Next
                {showShortcuts && <span aria-hidden="true" className="text-label-medium opacity-80">Enter</span>}
              </Button>
            ) : (
              <button
                type="button"
                onClick={s.giveUp}
                disabled={busy}
                className="flex w-full flex-col items-center gap-1 rounded-m3-md border-b-4 border-outline-variant bg-secondary-container px-3 py-4 text-label-large font-medium text-on-secondary-container hover:shadow-m3-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40"
              >
                <HelpIcon className="size-8" />
                I don’t know
                {showShortcuts && <span aria-hidden="true" className="text-label-medium opacity-70">{isMac ? "⌘↵" : "Ctrl+↵"}</span>}
              </button>
            )}
            <div className="flex gap-2" role="group" aria-label="Word options">
              <IconButton aria-label="Ignore this word" title="Ignore this word" disabled={busy} onClick={() => s.mark("ignored")}>
                <RemoveCircleIcon />
              </IconButton>
              <IconButton aria-label="I know this word already" title="I know this word already" disabled={busy} onClick={() => s.mark("longTerm")}>
                <BoltIcon />
              </IconButton>
            </div>
            {kind === "speed" && (
              <div role="timer" aria-label="Time left" className="text-title-large font-medium tabular-nums text-on-surface">
                {Math.ceil(s.remainingMs / 1000)}s
                <span className="sr-only"> of {SPEED_SECONDS} seconds left</span>
              </div>
            )}
          </div>
        </div>
      </main>
      {choosing && <ExerciseSettingsDialog onClose={() => setChoosing(false)} />}
      {exiting && (
        <ExitDialog
          onContinue={() => setExiting(false)}
          onEnd={() => {
            s.exit();
            navigate(backPath);
          }}
        />
      )}
    </div>
  );
}
