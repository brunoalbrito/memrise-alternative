import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DEFAULT_TEXT_MODEL = "gemini-3.8-flash";
export const DEFAULT_SPEECH_MODEL = "gemini-3.8-flash-tts";

interface AiState {
  /** Google AI Studio key. Empty string means not connected. Never log or display in full. */
  apiKey: string;
  textModel: string;
  speechModel: string;
  /** Pollinations key for images. Empty string means not connected. Never log or display in full. */
  pollinationsKey: string;
  /** Pollinations image model. Empty means the provider default. */
  pollinationsModel: string;
  saveKey: (key: string) => boolean;
  removeKey: () => void;
  savePollinationsKey: (key: string) => boolean;
  removePollinationsKey: () => void;
  setModels: (textModel: string, speechModel: string, pollinationsModel: string) => boolean;
  restoreModels: () => void;
}

const valid = (value: string) => value.trim() !== "" && !/\s/.test(value.trim());
const noSpaces = (value: string) => !/\s/.test(value.trim());

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      apiKey: "",
      textModel: DEFAULT_TEXT_MODEL,
      speechModel: DEFAULT_SPEECH_MODEL,
      pollinationsKey: "",
      pollinationsModel: "",
      saveKey: (key) => {
        if (!valid(key)) return false;
        set({ apiKey: key.trim() });
        return true;
      },
      removeKey: () => set({ apiKey: "" }),
      savePollinationsKey: (key) => {
        if (!valid(key)) return false;
        set({ pollinationsKey: key.trim() });
        return true;
      },
      removePollinationsKey: () => set({ pollinationsKey: "" }),
      setModels: (textModel, speechModel, pollinationsModel) => {
        if (!valid(textModel) || !valid(speechModel) || !noSpaces(pollinationsModel)) {
          return false;
        }
        set({
          textModel: textModel.trim(),
          speechModel: speechModel.trim(),
          pollinationsModel: pollinationsModel.trim(),
        });
        return true;
      },
      restoreModels: () =>
        set({
          textModel: DEFAULT_TEXT_MODEL,
          speechModel: DEFAULT_SPEECH_MODEL,
          pollinationsModel: "",
        }),
    }),
    {
      name: "membetter.ai",
      version: 2,
      // Version 1 stored a Google image model name that must not be sent to Pollinations.
      migrate: (persisted) => {
        const { imageModel: _dropped, ...rest } = (persisted ?? {}) as Record<string, unknown>;
        void _dropped;
        return rest as unknown as AiState;
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AiState>),
      }),
    },
  ),
);

/** "•••• 1234" for a saved key, "" when there is none. */
export function maskKey(key: string): string {
  return key ? `•••• ${key.slice(-4)}` : "";
}
