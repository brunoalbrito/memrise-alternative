import { Link } from "react-router";
import { CheckIcon } from "../../../shared/ui/icons";
import { levelState, type Level } from "../model/levels";
import { PlantIcon } from "./PlantIcon";

interface LevelCardProps {
  courseId: string;
  level: Level;
}

const stateLabel = {
  completed: "completed",
  "in-progress": "in progress",
  "not-started": "ready to learn",
} as const;

export function LevelCard({ courseId, level }: LevelCardProps) {
  const state = levelState(level);
  const stage =
    state === "completed" ? "flower" : state === "in-progress" ? "growing" : "pot";

  return (
    <Link
      to={`/course/${courseId}/levels/${level.number}`}
      aria-label={`Level ${level.number}, ${level.name}, ${stateLabel[state]}`}
      className={`relative flex flex-col items-center gap-2 rounded-m3-lg border border-outline-variant p-4 text-center hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        state === "not-started" ? "bg-surface-container" : "bg-surface-container-high"
      }`}
    >
      <span className="absolute left-3 top-3 flex size-7 items-center justify-center rounded-full bg-secondary-container text-label-large font-medium text-on-secondary-container">
        {level.number}
      </span>
      <PlantIcon stage={stage} className="mt-4 size-16" />
      {state === "completed" && <CheckIcon className="size-6 text-primary" />}
      <span className="text-label-large font-medium text-on-surface">
        {level.name}
      </span>
      {state === "in-progress" && (
        <span className="text-label-medium text-on-surface-variant">
          {level.learnedWords} / {level.totalWords} learned
        </span>
      )}
      {state === "not-started" && (
        <span className="text-label-medium text-on-surface-variant">
          Ready to learn
        </span>
      )}
    </Link>
  );
}
