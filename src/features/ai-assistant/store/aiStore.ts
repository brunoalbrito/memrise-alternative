import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_TEXT_MODEL = "gemini-3.8-flash";
export const DEFAULT_SPEECH_MODEL = "gemini-3.8-flash-tts";
export const DEFAULT_IMAGE_MODEL = "gemini-nano-banana-2.1";

interface AiState {
  /** Empty string means not connected. Never log or display in full. */
  apiKey: string;
  textModel: string;
  speechModel: string;
  imageModel: string;
  saveKey: (key: string) => boolean;
  removeKey: () => void;
  setModels: (textModel: string, speechModel: string, imageModel: string) => boolean;
  restoreModels: () => void;
}

const valid = (value: string) => value.trim() !== "" && !/\s/.test(value.trim());

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      apiKey: "",
      textModel: DEFAULT_TEXT_MODEL,
      speechModel: DEFAULT_SPEECH_MODEL,
      imageModel: DEFAULT_IMAGE_MODEL,
      saveKey: (key) => {
        if (!valid(key)) return false;
        set({ apiKey: key.trim() });
        return true;
      },
      removeKey: () => set({ apiKey: "" }),
      setModels: (textModel, speechModel, imageModel) => {
        if (!valid(textModel) || !valid(speechModel) || !valid(imageModel)) return false;
        set({
          textModel: textModel.trim(),
          speechModel: speechModel.trim(),
          imageModel: imageModel.trim(),
        });
        return true;
      },
      restoreModels: () =>
        set({
          textModel: DEFAULT_TEXT_MODEL,
          speechModel: DEFAULT_SPEECH_MODEL,
          imageModel: DEFAULT_IMAGE_MODEL,
        }),
    }),
    {
      name: "membetter.ai",
      version: 1,
      // Settings saved before the image model existed get the default.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AiState>),
        imageModel:
          (persisted as Partial<AiState> | undefined)?.imageModel || DEFAULT_IMAGE_MODEL,
      }),
    },
  ),
);

/** "•••• 1234" for a saved key, "" when there is none. */
export function maskKey(key: string): string {
  return key ? `•••• ${key.slice(-4)}` : "";
}
