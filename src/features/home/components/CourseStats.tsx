import { BoltIcon, LeafIcon } from "../../../shared/ui/icons";
import { goalProgress } from "../model/selectors";
import type { Course, GoalValue } from "../model/types";
import { GoalRing } from "./GoalRing";

interface CourseStatsProps {
  course: Course;
  goal?: GoalValue;
}

function Stat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-label-large font-medium text-on-surface ${
        value === 0 ? "opacity-50" : ""
      }`}
      aria-label={`${label}: ${value}`}
      role="group"
    >
      <span className="text-primary">{icon}</span>
      <span>{value}</span>
    </div>
  );
}

export function CourseStats({ course, goal }: CourseStatsProps) {
  return (
    <div className="flex items-center gap-4">
      <GoalRing
        progress={goalProgress(course, goal)}
        value={course.learnedToday}
      />
      <Stat
        value={course.itemsLearned}
        label="Items learned"
        icon={<LeafIcon className="size-5" />}
      />
      <Stat
        value={course.itemsDue}
        label="Items due for review"
        icon={<BoltIcon className="size-5" />}
      />
    </div>
  );
}
