import { useEffect, useRef, useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { AiError, aiMessage } from "../api/errors";
import { testConnection } from "../api/client";
import { maskKey, useAiStore } from "../store/aiStore";

interface ConnectDialogProps {
  onClose: () => void;
  onSaved?: () => void;
}

const inputClasses =
  "w-full rounded-m3-sm border border-outline bg-surface px-3 py-2 text-body-large text-on-surface focus:border-2 focus:border-primary focus:outline-none";

export function ConnectDialog({ onClose, onSaved }: ConnectDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const googleConnected = useAiStore((state) => state.googleConnected);
  const googleLast4 = useAiStore((state) => state.googleLast4);
  const weakProtection = useAiStore((state) => state.weakProtection);
  const textModel = useAiStore((state) => state.textModel);
  const speechModel = useAiStore((state) => state.speechModel);
  const nanoBananaConnected = useAiStore((state) => state.nanoBananaConnected);
  const nanoBananaLast4 = useAiStore((state) => state.nanoBananaLast4);
  const nanoBananaModel = useAiStore((state) => state.nanoBananaModel);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [textInput, setTextInput] = useState(textModel);
  const [speechInput, setSpeechInput] = useState(speechModel);
  const [imageInput, setImageInput] = useState(nanoBananaModel);
  const [pKeyInput, setPKeyInput] = useState("");
  const [pKeyError, setPKeyError] = useState("");
  const [pStatus, setPStatus] = useState("");
  const [confirmingRemoveNanoBanana, setConfirmingRemoveNanoBanana] = useState(false);
  const [modelsStatus, setModelsStatus] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const save = async () => {
    const problem = await useAiStore.getState().saveKey("google", keyInput);
    if (problem) {
      setKeyError(problem);
      return;
    }
    setKeyError("");
    setKeyInput("");
    setStatus("AI connected.");
    onSaved?.();
  };

  const test = async () => {
    setStatus("Testing…");
    try {
      await testConnection();
      setStatus("Connection works.");
    } catch (error) {
      setStatus(error instanceof AiError ? aiMessage(error.kind) : aiMessage("service"));
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="connect-ai-title"
      className="m-auto max-h-[90vh] w-[min(92vw,32rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="connect-ai-title" className="text-title-large">
        Connect AI
      </h2>
      <p className="mt-2 text-body-medium text-on-surface-variant">
        Auto-fill uses Google AI Studio to prepare a definition, example sentences, IPA and audio
        for a word.
      </p>
      <p className="mt-2 text-body-medium text-on-surface-variant">
        The word and the course language are sent to Google for text and audio. The word and the
        sentence you choose are sent to Pollinations to create the picture. Your keys are stored
        encrypted by your computer's protected storage, are only used by the app to call these services,
        and are never shown again. Use keys with spending limits.
      </p>
      <p className="mt-2 text-body-medium">
        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Get a key
        </a>
      </p>

      <div className="mt-4">
        <label htmlFor="ai-key" className="text-label-large font-medium">
          Google AI Studio API key
        </label>
        <input
          id="ai-key"
          type="password"
          autoComplete="off"
          value={keyInput}
          onChange={(event) => {
            setKeyInput(event.target.value);
            setKeyError("");
          }}
          aria-invalid={keyError ? true : undefined}
          aria-describedby="ai-key-help"
          className={`${inputClasses} mt-1 ${keyError ? "border-error" : ""}`}
        />
        <p id="ai-key-help" className="mt-1 text-body-medium text-on-surface-variant">
          {googleConnected ? `Saved key: ${maskKey(googleLast4)}` : "No key saved."}
        </p>
        {keyError && <p className="mt-1 text-body-medium text-error">{keyError}</p>}
        {weakProtection && (
          <p className="mt-1 text-body-medium text-error">
            This computer has no secure key storage set up, so saved keys are only lightly protected.
          </p>
        )}
      </div>

      <p aria-live="polite" className="mt-3 min-h-6 text-body-medium text-on-surface">
        {status}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="filled" onClick={() => void save()}>
          Save
        </Button>
        <Button variant="tonal" disabled={!googleConnected} onClick={() => void test()}>
          Test connection
        </Button>
        <Button variant="text" disabled={!googleConnected} onClick={() => setConfirmingRemove(true)}>
          Remove key
        </Button>
      </div>

      {confirmingRemove && (
        <div className="mt-3 rounded-m3-md bg-surface-container p-3" role="group" aria-label="Remove key">
          <p className="text-body-medium">Remove the key from this device?</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="text"
              onClick={() => {
                void useAiStore.getState().removeKey("google");
                setConfirmingRemove(false);
                setStatus("Key removed.");
              }}
            >
              Remove
            </Button>
            <Button variant="text" onClick={() => setConfirmingRemove(false)}>
              Keep
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-outline-variant pt-4">
        <label htmlFor="pollinations-key" className="text-label-large font-medium">
          Pollinations API key (for images)
        </label>
        <input
          id="pollinations-key"
          type="password"
          autoComplete="off"
          value={pKeyInput}
          onChange={(event) => {
            setPKeyInput(event.target.value);
            setPKeyError("");
          }}
          aria-invalid={pKeyError ? true : undefined}
          aria-describedby="pollinations-key-help"
          className={`${inputClasses} mt-1 ${pKeyError ? "border-error" : ""}`}
        />
        <p id="nano-banana-key-help" className="mt-1 text-body-medium text-on-surface-variant">
          {nanoBananaConnected ? `Saved key: ${maskKey(nanoBananaLast4)}` : "No key saved."}
        </p>
        {pKeyError && <p className="mt-1 text-body-medium text-error">{pKeyError}</p>}
        <p aria-live="polite" className="mt-2 min-h-6 text-body-medium text-on-surface">
          {pStatus}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <Button
            variant="filled"
            onClick={() => {
              void useAiStore
                .getState()
                .saveKey("nanoBanana", pKeyInput)
                .then((problem) => {
                  if (problem) {
                    setPKeyError(problem);
                    return;
                  }
                  setPKeyError("");
                  setPKeyInput("");
                  setPStatus("Nano Banana 2 Lite connected.");
                });
            }}
          >
            Save
          </Button>
          <Button
            variant="text"
            disabled={!nanoBananaConnected}
            onClick={() => setConfirmingRemoveNanoBanana(true)}
          >
            Remove key
          </Button>
        </div>
        {confirmingRemoveNanoBanana && (
          <div
            className="mt-3 rounded-m3-md bg-surface-container p-3"
            role="group"
            aria-label="Remove Nano Banana key"
          >
            <p className="text-body-medium">Remove the key from this device?</p>
            <div className="mt-2 flex gap-2">
              <Button
                variant="text"
                onClick={() => {
                  void useAiStore.getState().removeKey("nanoBanana");
                  setConfirmingRemoveNanoBanana(false);
                  setPStatus("Key removed.");
                }}
              >
                Remove
              </Button>
              <Button variant="text" onClick={() => setConfirmingRemovePollinations(false)}>
                Keep
              </Button>
            </div>
          </div>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-label-large font-medium">Models</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label htmlFor="ai-text-model" className="text-label-large font-medium">
              Text model
            </label>
            <input
              id="ai-text-model"
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              className={`${inputClasses} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="ai-speech-model" className="text-label-large font-medium">
              Speech model
            </label>
            <input
              id="ai-speech-model"
              value={speechInput}
              onChange={(event) => setSpeechInput(event.target.value)}
              className={`${inputClasses} mt-1`}
            />
          </div>
          <div>
            <label htmlFor="ai-image-model" className="text-label-large font-medium">
              Image model (Pollinations, optional)
            </label>
            <input
              id="ai-image-model"
              value={imageInput}
              placeholder="Provider default"
              onChange={(event) => setImageInput(event.target.value)}
              className={`${inputClasses} mt-1`}
            />
          </div>
          <p aria-live="polite" className="min-h-6 text-body-medium">
            {modelsStatus}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="tonal"
              onClick={() =>
                void useAiStore
                  .getState()
                  .setModels(textInput, speechInput, imageInput)
                  .then((problem) => setModelsStatus(problem ?? "Models saved."))
              }
            >
              Save models
            </Button>
            <Button
              variant="text"
              onClick={() => {
                void useAiStore
                  .getState()
                  .restoreModels()
                  .then(() => {
                    const { textModel: text, speechModel: speech, nanoBananaModel: image } =
                      useAiStore.getState();
                    setTextInput(text);
                    setSpeechInput(speech);
                    setImageInput(image);
                    setModelsStatus("Defaults restored.");
                  });
              }}
            >
              Restore defaults
            </Button>
          </div>
        </div>
      </details>

      <div className="mt-6 flex justify-end">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
