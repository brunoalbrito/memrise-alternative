import { useEffect, useRef } from "react";
import { Button } from "../../../shared/ui/Button";

interface ExitDialogProps {
  onContinue: () => void;
  onEnd: () => void;
}

export function ExitDialog({ onContinue, onEnd }: ExitDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onContinue();
      }}
      aria-labelledby="exit-title"
      className="m-auto w-[min(92vw,24rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="exit-title" className="text-title-large">
        End this session?
      </h2>
      <p className="mt-3 text-body-medium text-on-surface-variant">Your answers so far are saved.</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="text" onClick={onContinue}>
          Continue
        </Button>
        <Button variant="text" onClick={onEnd}>
          End session
        </Button>
      </div>
    </dialog>
  );
}
