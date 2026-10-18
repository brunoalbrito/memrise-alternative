import { useEffect, useRef } from "react";
import { Button } from "../../../shared/ui/Button";
import { useLearnerStore } from "../store/learnerStore";

interface RemoveCourseDialogProps {
  courseId: string;
  courseTitle: string;
  onClose: () => void;
  onRemoved?: () => void;
}

export function RemoveCourseDialog({
  courseId,
  courseTitle,
  onClose,
  onRemoved,
}: RemoveCourseDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const removeCourse = useLearnerStore((state) => state.removeCourse);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`remove-title-${courseId}`}
      className="m-auto w-[min(92vw,24rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id={`remove-title-${courseId}`} className="text-title-large">
        Remove course?
      </h2>
      <p className="mt-3 text-body-medium text-on-surface-variant">
        Remove {courseTitle} from your courses?
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Cancel
        </Button>
        <Button
          variant="text"
          onClick={() => {
            removeCourse(courseId);
            onRemoved?.();
            dialogRef.current?.close();
          }}
        >
          Remove
        </Button>
      </div>
    </dialog>
  );
}
