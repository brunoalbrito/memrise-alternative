import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { EXERCISE_KINDS, type ExerciseKind } from "../model/exercises";
import { EXERCISE_INFO, PRESETS } from "../model/exerciseInfo";
import { useExerciseSettings } from "../store/exerciseSettings";

const groups = [
  { id: "choose", title: "Choose the answer" },
  { id: "listen", title: "Listening" },
  { id: "type", title: "Typing" },
] as const;

/** Which exercise types practice may use. */
export function ExerciseSettingsDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const enabled = useExerciseSettings((s) => s.enabled);
  const setEnabled = useExerciseSettings((s) => s.setEnabled);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const apply = async (kinds: ExerciseKind[]) => setMessage((await setEnabled(kinds)) ?? "");
  const toggle = (kind: ExerciseKind, on: boolean) => {
    const next = on ? [...enabled, kind] : enabled.filter((k) => k !== kind);
    void apply(EXERCISE_KINDS.filter((k) => next.includes(k)));
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="exercises-title"
      className="m-auto max-h-[90vh] w-[min(92vw,34rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="exercises-title" className="text-title-large">
        Exercise types
      </h2>
      <p className="mt-2 text-body-medium text-on-surface-variant">
        Choose how words are practiced. Exercises that need a picture, a meaning or audio are only used for words that have them. Changes apply from the next session.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Presets">
        {PRESETS.map((preset) => (
          <Button key={preset.id} variant="tonal" onClick={() => void apply(EXERCISE_KINDS.filter(preset.kinds))}>
            {preset.label}
          </Button>
        ))}
      </div>
      {groups.map((group) => (
        <fieldset key={group.id} className="mt-4">
          <legend className="text-label-large font-medium text-on-surface-variant">{group.title}</legend>
          {EXERCISE_KINDS.filter((k) => EXERCISE_INFO[k].group === group.id).map((kind) => {
            const on = enabled.includes(kind);
            return (
              <label key={kind} className="flex cursor-pointer items-start gap-3 py-2">
                <input
                  type="checkbox"
                  role="switch"
                  checked={on}
                  disabled={on && enabled.length === 1}
                  onChange={(event) => toggle(kind, event.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-primary"
                />
                <span>
                  <span className="block text-body-large">{EXERCISE_INFO[kind].label}</span>
                  <span className="block text-body-medium text-on-surface-variant">{EXERCISE_INFO[kind].description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
      <p aria-live="polite" className="mt-3 min-h-6 text-body-medium text-error">
        {message}
      </p>
      <div className="mt-2 flex justify-end">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
