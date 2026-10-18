import { useEffect, useRef, useState } from "react";
import { getApi } from "../../../shared/api";
import { Button } from "../../../shared/ui/Button";
import { DEFAULT_NEW_PER_DAY, useProgressStore } from "../store/progressStore";

const OPTIONS = [5, 10, 15, 20, 30] as const;

interface NewWordsDialogProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
}

/** How many new words Learn may introduce per day for one course. */
export function NewWordsDialog({ courseId, courseTitle, onClose }: NewWordsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const current = useProgressStore((state) => state.newPerDay[courseId]) ?? DEFAULT_NEW_PER_DAY;
  const [selected, setSelected] = useState<number>(current);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const save = async () => {
    try {
      const result = await getApi().study.setNewPerDay(courseId, selected);
      if (!result.ok) return setError(result.error.message);
      await useProgressStore.getState().refresh();
      dialogRef.current?.close();
    } catch {
      setError("Could not save. Please try again.");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`newwords-title-${courseId}`}
      className="m-auto w-[min(92vw,24rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id={`newwords-title-${courseId}`} className="text-title-large">
        New words per day
      </h2>
      <p className="mt-1 text-body-medium text-on-surface-variant">{courseTitle}</p>
      <fieldset className="mt-4 flex flex-col">
        <legend className="sr-only">New words to learn per day</legend>
        {OPTIONS.map((value) => (
          <label key={value} className="flex h-12 cursor-pointer items-center gap-3 text-body-large">
            <input
              type="radio"
              name={`newwords-${courseId}`}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="size-5 accent-primary"
            />
            {value} new words per day
          </label>
        ))}
      </fieldset>
      {error && <p className="mt-2 text-body-medium text-error">{error}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Cancel
        </Button>
        <Button variant="text" onClick={() => void save()}>
          Save
        </Button>
      </div>
    </dialog>
  );
}
