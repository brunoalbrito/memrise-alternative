import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../shared/ui/Button";
import { IconButton } from "../../../shared/ui/IconButton";
import { CloseIcon, LeafIcon, TimerIcon, WaterDropIcon } from "../../../shared/ui/icons";
import { dueBadge, recommendedSession } from "../model/selectors";
import type { Course } from "../model/types";

interface SessionDialogProps {
  course: Course;
  onClose: () => void;
}

const circleBase =
  "relative flex size-16 items-center justify-center rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-40";

export function SessionDialog({ course, onClose }: SessionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const titleId = `session-title-${course.id}`;
  const recommended = recommendedSession(course);
  const noneDue = course.itemsDue === 0;
  const badge = dueBadge(course.itemsDue);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const go = (path: string) => {
    dialogRef.current?.close();
    navigate(path);
  };

  const learnPath = `/course/${course.id}/learn`;
  const classicPath = `/course/${course.id}/review`;
  const speedPath = `/course/${course.id}/speed-review`;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      aria-labelledby={titleId}
      className="m-auto max-h-[90vh] w-[min(92vw,28rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-0 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="min-w-0 break-words text-title-large">
            {course.title}
          </h2>
          <IconButton aria-label="Close" onClick={() => dialogRef.current?.close()}>
            <CloseIcon />
          </IconButton>
        </div>

        <h3 className="mt-6 text-label-large font-medium text-on-surface-variant">
          Next up for you
        </h3>
        <div className="mt-2">
          <Button
            icon={
              recommended === "classic-review" ? (
                <WaterDropIcon className="size-5" />
              ) : (
                <LeafIcon className="size-5" />
              )
            }
            className="h-14 px-8 text-title-medium"
            onClick={() => go(recommended === "classic-review" ? classicPath : learnPath)}
          >
            {recommended === "classic-review" ? "Classic review" : "Learn new words"}
          </Button>
        </div>

        <h3 className="mt-6 text-label-large font-medium text-on-surface-variant">
          Or choose your session
        </h3>
        <div className="mt-3 flex flex-wrap gap-6">
          <button
            type="button"
            onClick={() => go(learnPath)}
            className="flex w-20 flex-col items-center gap-2 text-center focus-visible:outline-none"
          >
            <span className={`${circleBase} bg-primary-container text-on-primary-container`}>
              <LeafIcon className="size-8" />
            </span>
            <span className="text-label-medium">Learn new words</span>
          </button>
          <button
            type="button"
            disabled={noneDue}
            onClick={() => go(classicPath)}
            className="group flex w-20 flex-col items-center gap-2 text-center focus-visible:outline-none disabled:opacity-40"
          >
            <span className={`${circleBase} bg-secondary-container text-on-secondary-container`}>
              <WaterDropIcon className="size-8" />
              {badge && (
                <span className="absolute -right-2 -top-2 rounded-m3-sm bg-on-surface px-1.5 py-0.5 text-label-medium font-medium text-surface">
                  {badge}
                  <span className="sr-only"> {course.itemsDue} words due</span>
                </span>
              )}
            </span>
            <span className="text-label-medium">Classic review</span>
          </button>
          <button
            type="button"
            disabled={noneDue}
            onClick={() => go(speedPath)}
            className="flex w-20 flex-col items-center gap-2 text-center focus-visible:outline-none disabled:opacity-40"
          >
            <span className={`${circleBase} bg-surface-variant text-on-surface-variant`}>
              <TimerIcon className="size-8" />
            </span>
            <span className="text-label-medium">Speed review</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
