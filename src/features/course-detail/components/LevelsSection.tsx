import { Link } from "react-router";
import { EditIcon } from "../../../shared/ui/icons";
import type { Level } from "../model/levels";
import { LevelCard } from "./LevelCard";
import { Tabs } from "./Tabs";

interface LevelsSectionProps {
  courseId: string;
  levels: Level[];
  editHref?: string;
}

export function LevelsSection({ courseId, levels, editHref }: LevelsSectionProps) {
  return (
    <Tabs
      label="Course sections"
      tabs={[{ id: "levels", label: `Levels (${levels.length})` }]}
      selectedId="levels"
      onSelect={() => {}}
      action={
        editHref ? (
          <Link
            to={editHref}
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-label-large font-medium text-on-surface-variant hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <EditIcon className="size-5" />
            Edit Course
          </Link>
        ) : undefined
      }
    >
      {levels.length === 0 ? (
        <p className="rounded-m3-lg bg-surface-container px-4 py-8 text-center text-body-large text-on-surface-variant">
          This course has no levels yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {levels.map((level) => (
            <li key={level.number} className="flex">
              <div className="flex-1">
                <LevelCard courseId={courseId} level={level} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Tabs>
  );
}
