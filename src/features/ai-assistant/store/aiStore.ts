import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_TEXT_MODEL = "gemini-3.8-flash";
export const DEFAULT_SPEECH_MODEL = "gemini-3.8-flash-tts";

interface AiState {
  /** Empty string means not connected. Never log or display in full. */
  apiKey: string;
  textModel: string;
  speechModel: string;
  saveKey: (key: string) => boolean;
  removeKey: () => void;
  setModels: (textModel: string, speechModel: string) => boolean;
  restoreModels: () => void;
}

const valid = (value: string) => value.trim() !== "" && !/\s/.test(value.trim());

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      apiKey: "",
      textModel: DEFAULT_TEXT_MODEL,
      speechModel: DEFAULT_SPEECH_MODEL,
      saveKey: (key) => {
        if (!valid(key)) return false;
        set({ apiKey: key.trim() });
        return true;
      },
      removeKey: () => set({ apiKey: "" }),
      setModels: (textModel, speechModel) => {
        if (!valid(textModel) || !valid(speechModel)) return false;
        set({ textModel: textModel.trim(), speechModel: speechModel.trim() });
        return true;
      },
      restoreModels: () =>
        set({ textModel: DEFAULT_TEXT_MODEL, speechModel: DEFAULT_SPEECH_MODEL }),
    }),
    { name: "membetter.ai", version: 1 },
  ),
);

/** "•••• 1234" for a saved key, "" when there is none. */
export function maskKey(key: string): string {
  return key ? `•••• ${key.slice(-4)}` : "";
}
