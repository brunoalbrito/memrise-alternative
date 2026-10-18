import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { useExchangeStore } from "../store/exchangeStore";

/** Confirms an export and lets the learner choose whether their study progress goes into the file. */
export function ExportDialog({ count }: { count: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirm = useExchangeStore((s) => s.confirmExport);
  const cancel = useExchangeStore((s) => s.cancelExport);
  const [withProgress, setWithProgress] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      aria-labelledby="export-title"
      className="m-auto w-[min(92vw,26rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="export-title" className="text-title-large">
        {count === 1 ? "Export course" : `Export ${count} courses`}
      </h2>
      <p className="mt-3 text-body-medium text-on-surface-variant">
        The file contains the words, levels, pictures and audio. Share it, or import it on another computer.
      </p>
      <label className="mt-3 flex min-h-10 items-center gap-3 text-body-medium">
        <input
          type="checkbox"
          checked={withProgress}
          onChange={(event) => setWithProgress(event.target.checked)}
          className="size-5 accent-primary"
        />
        Include my study progress
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={cancel}>
          Cancel
        </Button>
        <Button variant="filled" onClick={() => void confirm(withProgress)}>
          Export
        </Button>
      </div>
    </dialog>
  );
}
