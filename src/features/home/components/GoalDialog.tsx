import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { GOAL_VALUES, type GoalValue } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

interface GoalDialogProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

export function GoalDialog({ courseId, courseTitle, onClose }: GoalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = useLearnerStore((state) => state.goals[courseId]);
  const setGoal = useLearnerStore((state) => state.setGoal);
  const [selected, setSelected] = useState<GoalValue | null>(current ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const save = () => {
    setGoal(courseId, selected);
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`goal-title-${courseId}`}
      className="m-auto w-[min(92vw,24rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id={`goal-title-${courseId}`} className="text-title-large">
        Set daily goal
      </h2>
      <p className="mt-1 text-body-medium text-on-surface-variant">
        {courseTitle}
      </p>
      <fieldset className="mt-4 flex flex-col">
        <legend className="sr-only">Items to learn per day</legend>
        {GOAL_VALUES.map((value) => (
          <label
            key={value}
            className="flex h-12 cursor-pointer items-center gap-3 text-body-large"
          >
            <input
              type="radio"
              name={`goal-${courseId}`}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="size-5 accent-primary"
            />
            {value} items per day
          </label>
        ))}
        <label className="flex h-12 cursor-pointer items-center gap-3 text-body-large">
          <input
            type="radio"
            name={`goal-${courseId}`}
            checked={selected === null}
            onChange={() => setSelected(null)}
            className="size-5 accent-primary"
          />
          No goal
        </label>
      </fieldset>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Cancel
        </Button>
        <Button variant="text" onClick={save}>
          Save
        </Button>
      </div>
    </dialog>
  );
}
