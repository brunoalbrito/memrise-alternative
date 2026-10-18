import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "../../../shared/ui/Button";
import { IconButton } from "../../../shared/ui/IconButton";
import { AppsIcon, FlagIcon, TimerIcon } from "../../../shared/ui/icons";
import { getCategoryById } from "../data/sampleCourses";
import { percentLearned, primaryAction } from "../model/selectors";
import type { Course, GoalValue } from "../model/types";
import { CourseOptionsMenu } from "./CourseOptionsMenu";
import { CourseStats } from "./CourseStats";
import { ProgressBar } from "./ProgressBar";
import { SessionDialog } from "./SessionDialog";

interface CourseCardProps {
  course: Course;
  goal?: GoalValue;
}

export function CourseCard({ course, goal }: CourseCardProps) {
  const navigate = useNavigate();
  const [sessionOpen, setSessionOpen] = useState(false);
  const gridButtonRef = useRef<HTMLButtonElement>(null);
  const percent = percentLearned(course);
  const action = primaryAction(course);
  const category = getCategoryById(course.categoryId);

  return (
    <article
      aria-label={course.title}
      className="relative rounded-m3-lg border border-outline-variant bg-surface-container p-4 sm:p-5"
    >
      <div className="flex items-start gap-4">
        <div
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-m3-md bg-primary-container text-2xl"
        >
          {course.coverImage ? (
            <img src={course.coverImage} alt="" className="size-full object-cover" />
          ) : (
            category?.icon
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-title-large text-on-surface">
            <Link
              to={`/course/${course.id}`}
              className="after:absolute after:inset-0 after:rounded-m3-lg after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary"
            >
              {course.title}
            </Link>
          </h2>
          <div className="mt-2 flex items-baseline gap-4 text-body-medium text-on-surface">
            <span className="font-medium">{percent}%</span>
            <span>
              <span className="font-medium">
                {course.itemsLearned} / {course.totalItems}
              </span>{" "}
              items learned
            </span>
          </div>
        </div>
        <div className="relative">
          <CourseOptionsMenu course={course} goal={goal} />
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar value={percent} label={`${course.title} progress`} />
      </div>

      <div className="pointer-events-none relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <CourseStats course={course} goal={goal} />
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="tonal"
            icon={
              action === "speed-review" ? (
                <TimerIcon className="size-5" />
              ) : (
                <FlagIcon className="size-5" />
              )
            }
            onClick={() =>
              navigate(
                action === "speed-review"
                  ? `/course/${course.id}/speed-review`
                  : `/course/${course.id}/learn`,
              )
            }
          >
            {action === "speed-review" ? "Speed review" : "Learn new words"}
          </Button>
          <IconButton
            ref={gridButtonRef}
            variant="tonal"
            aria-label="Choose a session"
            aria-haspopup="dialog"
            onClick={() => setSessionOpen(true)}
          >
            <AppsIcon />
          </IconButton>
          {sessionOpen && (
            <SessionDialog
              course={course}
              onClose={() => {
                setSessionOpen(false);
                gridButtonRef.current?.focus();
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}
