import { Link } from "react-router";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../../shared/ui/icons";

interface LevelNavProps {
  courseId: string;
  previous?: { number: number; name: string };
  next?: { number: number; name: string };
}

const card =
  "flex items-center justify-between gap-2 rounded-m3-lg bg-surface-container-high px-5 py-4 text-title-medium font-medium text-on-surface hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Cards to the neighbouring levels. */
export function LevelNav({ courseId, previous, next }: LevelNavProps) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Other levels" className="flex gap-3 lg:flex-col">
      {previous && (
        <Link to={`/course/${courseId}/levels/${previous.number}`} className={`${card} flex-1`} aria-label={`Previous level: Level ${previous.number}, ${previous.name}`}>
          <ChevronLeftIcon className="size-5" />
          Level {previous.number}
        </Link>
      )}
      {next && (
        <Link to={`/course/${courseId}/levels/${next.number}`} className={`${card} flex-1`} aria-label={`Next level: Level ${next.number}, ${next.name}`}>
          Level {next.number}
          <ChevronRightIcon className="size-5" />
        </Link>
      )}
    </nav>
  );
}
