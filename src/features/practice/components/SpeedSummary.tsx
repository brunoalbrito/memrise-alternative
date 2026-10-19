import { Link } from "react-router";
import { Button } from "../../../shared/ui/Button";
import type { SpeedResult } from "../hooks/useSpeedGame";
import { accuracy, type GameState } from "../model/speedGame";

interface SpeedSummaryProps {
  title: string;
  game: GameState;
  result: SpeedResult | null;
  backPath: string;
  leftOut: number;
  onAgain: () => void;
}

const stat = (label: string, value: string | number) => (
  <div className="rounded-m3-md bg-surface-container-high px-4 py-3 text-center">
    <div className="text-headline-medium text-on-surface">{value}</div>
    <div className="text-label-large text-on-surface-variant">{label}</div>
  </div>
);

/** The result of a game: score, personal best, and the words that were missed. */
export function SpeedSummary({ title, game, result, backPath, leftOut, onAgain }: SpeedSummaryProps) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-12 text-center">
      <h1 className="text-headline-medium text-on-surface">{game.lives > 0 ? "Round complete" : "Game over"}</h1>
      <p className="text-body-large text-on-surface-variant">{title}</p>
      <div aria-label="Score" className="text-display-small text-primary">
        {game.score.toLocaleString()} points
      </div>
      {result?.improved && <p className="rounded-full bg-tertiary-container px-4 py-1 text-label-large font-medium text-on-tertiary-container">New personal best!</p>}
      {result && !result.improved && result.best !== null && <p className="text-body-medium text-on-surface-variant">Your best on this course: {result.best.toLocaleString()} points</p>}
      <div className="grid w-full grid-cols-3 gap-3">
        {stat("Correct", game.correct)}
        {stat("Longest streak", game.bestStreak)}
        {stat("Accuracy", `${accuracy(game)}%`)}
      </div>
      {game.missed.length > 0 && (
        <section aria-label="Missed words" className="w-full rounded-m3-lg bg-surface-container p-4 text-left">
          <h2 className="text-title-medium text-on-surface">Words to look at again</h2>
          <ul className="mt-2 divide-y divide-outline-variant">
            {game.missed.map((m, i) => (
              <li key={`${m.wordId}-${i}`} className="py-2">
                <span className="font-medium text-on-surface">{m.text}</span>
                {m.answer !== "" && <span className="text-on-surface-variant"> · {m.answer}</span>}
                {m.timedOut && <span className="text-on-surface-variant"> (too slow)</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {leftOut > 0 && (
        <p className="text-body-medium text-on-surface-variant">
          {leftOut} due {leftOut === 1 ? "word was" : "words were"} left out because {leftOut === 1 ? "it cannot" : "they cannot"} be asked as a multiple-choice question yet.
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="tonal" onClick={onAgain}>
          Play again
        </Button>
        <Link
          to={backPath}
          className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-large font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Done
        </Link>
      </div>
    </main>
  );
}
