import { useEffect, useRef } from "react";
import { Button } from "../../../shared/ui/Button";

interface DeleteLevelDialogProps {
  levelNumber: number;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteLevelDialog({
  levelNumber,
  onConfirm,
  onClose,
}: DeleteLevelDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="delete-level-title"
      className="m-auto w-[min(92vw,24rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="delete-level-title" className="text-title-large">
        Delete level {levelNumber} and its words?
      </h2>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Cancel
        </Button>
        <Button
          variant="text"
          onClick={() => {
            onConfirm();
            dialogRef.current?.close();
          }}
        >
          Delete
        </Button>
      </div>
    </dialog>
  );
}
