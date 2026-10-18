import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { aiMessage } from "../api/errors";
import { useSuggestions } from "../hooks/useSuggestions";

export interface AutoFillResult {
  definition: string;
  sentence: string;
  ipa: string;
  audio: Blob | null;
}

interface SuggestionDialogProps {
  word: string;
  languageName: string;
  onApply: (result: AutoFillResult) => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

function AudioPreview({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const created = URL.createObjectURL(blob);
    queueMicrotask(() => setUrl(created));
    return () => URL.revokeObjectURL(created);
  }, [blob]);
  return url ? (
    <audio controls src={url} className="w-full" aria-label="Play pronunciation" />
  ) : null;
}

export function SuggestionDialog({
  word,
  languageName,
  onApply,
  onClose,
  onOpenSettings,
}: SuggestionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { state, retry, select, cancel } = useSuggestions(word, languageName);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => {
    cancel();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        cancel();
        onClose();
      }}
      aria-labelledby="suggestions-title"
      className="m-auto max-h-[90vh] w-[min(92vw,32rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="suggestions-title" className="break-words text-title-large">
        Suggestions for “{word.trim()}”
      </h2>

      {state.status === "loading" && (
        <>
          <p aria-live="polite" className="mt-4 text-body-large">
            Preparing suggestions…
          </p>
          <div className="mt-6 flex justify-end">
            <Button variant="text" onClick={close}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {state.status === "error" && (
        <>
          <p aria-live="assertive" role="alert" className="mt-4 text-body-large text-error">
            {aiMessage(state.kind)}
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {state.kind === "invalid-key" ? (
              <Button
                variant="tonal"
                onClick={() => {
                  close();
                  onOpenSettings();
                }}
              >
                Open AI settings
              </Button>
            ) : (
              <Button variant="tonal" onClick={retry}>
                Try again
              </Button>
            )}
            <Button variant="text" onClick={close}>
              Close
            </Button>
          </div>
        </>
      )}

      {state.status === "ready" && (
        <>
          <section className="mt-4">
            <h3 className="text-label-large font-medium text-on-surface-variant">Definition</h3>
            <p className="mt-1 text-body-large">{state.suggestion.definition}</p>
          </section>

          <fieldset className="mt-4">
            <legend className="text-label-large font-medium text-on-surface-variant">
              Example sentence
            </legend>
            <div className="mt-1 flex flex-col">
              {state.suggestion.sentences.map((sentence, index) => (
                <label
                  key={index}
                  className="flex cursor-pointer items-start gap-3 rounded-m3-sm px-2 py-2 hover:bg-on-surface/8"
                >
                  <input
                    type="radio"
                    name="sentence"
                    checked={state.selected === index}
                    onChange={() => select(index)}
                    className="mt-1 size-5 accent-primary"
                  />
                  <span className="text-body-large">
                    {sentence}
                    {index === state.suggestion.best && (
                      <span className="ml-2 rounded-full bg-secondary-container px-2 py-0.5 text-label-medium font-medium text-on-secondary-container">
                        Best
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <section className="mt-4">
            <h3 className="text-label-large font-medium text-on-surface-variant">IPA</h3>
            <p className="mt-1 text-body-large">/{state.suggestion.ipa}/</p>
          </section>

          <section className="mt-4">
            <h3 className="text-label-large font-medium text-on-surface-variant">Audio</h3>
            {state.suggestion.audio ? (
              <AudioPreview blob={state.suggestion.audio} />
            ) : (
              <p className="mt-1 text-body-medium text-on-surface-variant">{state.audioNote}</p>
            )}
          </section>

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="text" onClick={retry}>
              Try again
            </Button>
            <Button variant="text" onClick={close}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onApply({
                  definition: state.suggestion.definition,
                  sentence: state.suggestion.sentences[state.selected],
                  ipa: state.suggestion.ipa,
                  audio: state.suggestion.audio,
                });
                close();
              }}
            >
              Apply
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}
