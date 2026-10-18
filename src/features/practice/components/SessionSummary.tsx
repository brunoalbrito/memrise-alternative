import { Link } from "react-router";
import { Button } from "../../../shared/ui/Button";
import type { Totals } from "../hooks/usePracticeSession";

interface SessionSummaryProps {
  backPath: string;
  title: string;
  totals: Totals;
  onAgain: () => void;
}

const stat = (label: string, value: number) => (
  <div className="rounded-m3-md bg-surface-container-high px-4 py-3 text-center">
    <div className="text-headline-medium text-on-surface">{value}</div>
    <div className="text-label-large text-on-surface-variant">{label}</div>
  </div>
);

export function SessionSummary({ backPath, title, totals, onAgain }: SessionSummaryProps) {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-headline-medium text-on-surface">Session complete</h1>
      <p className="text-body-large text-on-surface-variant">{title}</p>
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {stat("Words", totals.answered)}
        {stat("Correct", totals.correct)}
        {stat("Hints used", totals.hints)}
        {stat("Points", totals.points)}
      </div>
      {totals.skipped > 0 && (
        <p className="text-body-medium text-on-surface-variant">
          {totals.skipped} {totals.skipped === 1 ? "word was" : "words were"} skipped because {totals.skipped === 1 ? "it has" : "they have"} no picture, meaning or example.
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="tonal" onClick={onAgain}>
          Practice again
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
