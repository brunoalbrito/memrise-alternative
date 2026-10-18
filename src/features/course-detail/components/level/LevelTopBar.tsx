import { Link } from "react-router";
import { EditIcon, ListIcon } from "../../../../shared/ui/icons";

const link =
  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-large font-medium text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** "Levels (N)" back to the course, and "Edit Course". */
export function LevelTopBar({ courseId, levelCount }: { courseId: string; levelCount: number }) {
  return (
    <nav aria-label="Level" className="border-b border-outline-variant bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-1">
        <Link to={`/course/${courseId}`} className={link}>
          <ListIcon className="size-5" />
          Levels ({levelCount})
        </Link>
        <Link to={`/course/${courseId}/edit`} className={link}>
          <EditIcon className="size-5" />
          Edit Course
        </Link>
      </div>
    </nav>
  );
}
