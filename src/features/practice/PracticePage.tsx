import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../../shared/ui/Button";
import { IconButton } from "../../shared/ui/IconButton";
import { BackspaceIcon, CloseIcon, HelpIcon, KeyboardIcon, SparkleIcon, WaterDropIcon } from "../../shared/ui/icons";
import { useCourse, useCourseLevels, languages } from "../home";
import { ExitDialog } from "./components/ExitDialog";
import { LetterTile } from "./components/LetterTile";
import { SessionSummary } from "./components/SessionSummary";
import { WordClue } from "./components/WordClue";
import { SPEED_SECONDS, usePracticeSession, type PracticeKind } from "./hooks/usePracticeSession";
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

export function PracticePage({ kind }: { kind: PracticeKind }) {
  const { id = "" } = useParams();
  const course = useCourse(id);
  const levels = useCourseLevels(id);
  const [round, setRound] = useState(0);

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
  // A new key restarts the session ("Practice again").
  return <Session key={round} courseId={id} title={course.title} kind={kind} levels={levels} languageId={course.teachingLanguageId} onAgain={() => setRound((n) => n + 1)} />;
}

interface SessionProps {
  courseId: string;
  title: string;
  kind: PracticeKind;
  levels: ReturnType<typeof useCourseLevels>;
  languageId?: string;
  onAgain: () => void;
}

function Session({ courseId, title, kind, levels, languageId, onAgain }: SessionProps) {
  const navigate = useNavigate();
  const s = usePracticeSession(courseId, kind, levels);
  const [showShortcuts, setShowShortcuts] = useState(readShortcuts);
  const [exiting, setExiting] = useState(false);
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
      if (leaving || current.finished) return;
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

  const header = (
    <header className="flex items-center gap-3 bg-primary-container px-4 py-3 text-on-primary-container">
      <WaterDropIcon className="size-7" />
      <h1 className="min-w-0 flex-1 truncate text-title-large font-medium underline decoration-2 underline-offset-4">{title}</h1>
      <IconButton aria-label="Show keyboard shortcuts" aria-pressed={showShortcuts} onClick={toggleShortcuts}>
        <KeyboardIcon />
      </IconButton>
      <IconButton aria-label="Close" onClick={() => (s.finished ? navigate(`/course/${courseId}`) : setExiting(true))}>
        <CloseIcon />
      </IconButton>
    </header>
  );

  if (s.finished) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <SessionSummary courseId={courseId} title={title} totals={s.totals} onAgain={onAgain} />
      </div>
    );
  }

  if (!s.word) {
    return (
      <div className="min-h-screen bg-surface">
        {header}
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-headline-medium text-on-surface">Nothing to practice yet</h1>
          <p className="text-body-large text-on-surface-variant">Add words with a picture, meaning or example to this course first.</p>
          <Link to={`/course/${courseId}/edit`} className="text-label-large font-medium text-primary underline">
            Edit course
          </Link>
        </main>
      </div>
    );
  }

  const busy = s.phase === "correct" || s.phase === "revealed";
  const banner =
    s.phase === "correct"
      ? { text: "Correct!", cls: "bg-primary-container text-on-primary-container" }
      : s.phase === "wrong"
        ? { text: "Not quite. Fix it or ask for a hint.", cls: "bg-error-container text-on-error-container" }
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
            aria-valuenow={s.totals.answered}
            aria-valuetext={`${s.totals.answered} of ${s.total}`}
            className="h-8 flex-1 overflow-hidden rounded-full bg-surface-variant"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${(s.totals.answered / s.total) * 100}%` }} />
          </div>
          <div aria-live="polite" aria-label="Points" className="min-w-14 rounded-full bg-surface-container-high px-4 py-1 text-center text-label-large font-medium">
            {s.totals.points}
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
          <WordClue key={s.word.id} word={s.word} />

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
            {kind === "speed" && (
              <div role="timer" aria-label="Time left" className="text-title-large font-medium tabular-nums text-on-surface">
                {Math.ceil(s.remainingMs / 1000)}s
                <span className="sr-only"> of {SPEED_SECONDS} seconds left</span>
              </div>
            )}
          </div>
        </div>
      </main>
      {exiting && (
        <ExitDialog
          onContinue={() => setExiting(false)}
          onEnd={() => {
            s.exit();
            navigate(`/course/${courseId}`);
          }}
        />
      )}
    </div>
  );
}
