import { useNavigate } from "react-router";
import { Button } from "../../../shared/ui/Button";
import { IconButton } from "../../../shared/ui/IconButton";
import { TimerIcon } from "../../../shared/ui/icons";
import {
  CourseOptionsMenu,
  ProgressBar,
  type Course,
  type GoalValue,
} from "../../home";

interface ProgressSummaryProps {
  course: Course;
  percent: number;
  longTermCount: number;
  ignoredCount: number;
  dueCount: number;
  goal?: GoalValue;
}

export function ProgressSummary({
  course,
  percent,
  longTermCount,
  ignoredCount,
  dueCount,
  goal,
}: ProgressSummaryProps) {
  const navigate = useNavigate();
  const noneDue = dueCount === 0;

  return (
    <section
      aria-label="Course progress"
      className="rounded-m3-lg bg-surface-container p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-body-large text-on-surface">
        <p>
          <span className="font-medium">
            {course.itemsLearned} / {course.totalItems}
          </span>{" "}
          words learned ({longTermCount} in long term memory)
        </p>
        <p className="text-body-medium text-on-surface-variant">
          {ignoredCount} ignored
        </p>
      </div>
      <div className="mt-3">
        <ProgressBar value={percent} label="Course progress" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <CourseOptionsMenu
          course={course}
          goal={goal}
          triggerLabel="Options"
          onRemoved={() => navigate("/")}
        />
        <div className="flex items-center gap-2">
          <IconButton
            variant="tonal"
            aria-label="Speed review"
            disabled={noneDue}
            className="disabled:opacity-40"
            onClick={() => navigate(`/course/${course.id}/speed-review`)}
          >
            <TimerIcon />
          </IconButton>
          <Button
            variant="tonal"
            disabled={noneDue}
            onClick={() => navigate(`/course/${course.id}/review`)}
          >
            Review ({dueCount})
          </Button>
        </div>
      </div>
    </section>
  );
}
