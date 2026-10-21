import { create } from "zustand";
import { getApi, isDesktop, type Result } from "../../../shared/api";

export const DEFAULT_TEXT_MODEL = "gemini-3.8-flash";
export const DEFAULT_SPEECH_MODEL = "gemini-3.8-flash-tts";

/**
 * What the screens know about AI: which keys are connected (and their last four characters) and the model names.
 * The keys themselves live only in the app's protected storage; they are sent once when saved and never come back.
 */
interface AiState {
  ready: boolean;
  googleConnected: boolean;
  googleLast4: string;
  textModel: string;
  speechModel: string;
  imageModel: string;
  /** The operating system offers only weak protection for saved keys. */
  weakProtection: boolean;
  hydrate: () => Promise<void>;
  saveKey: (provider: "google", key: string) => Promise<string | null>;
  removeKey: (provider: "google") => Promise<void>;
  setModels: (textModel: string, speechModel: string, imageModel: string) => Promise<string | null>;
  restoreModels: () => Promise<void>;
}

const UNAVAILABLE = "AI is available in the desktop app.";
const error = (result: Result<unknown>): string | null => (result.ok ? null : result.error.message);

export const useAiStore = create<AiState>()((set, get) => ({
  ready: !isDesktop(),
  googleConnected: false,
  googleLast4: "",
  textModel: DEFAULT_TEXT_MODEL,
  speechModel: DEFAULT_SPEECH_MODEL,
  imageModel: "",
  weakProtection: false,
  hydrate: async () => {
    if (!isDesktop()) return;
    const result = await getApi().ai.status();
    if (!result.ok) return;
    const { google, models, weakProtection } = result.data;
    set({
      ready: true,
      googleConnected: google.connected,
      googleLast4: google.last4,
      weakProtection,
      ...models,
    });
  },
  saveKey: async (provider, key) => {
    if (!isDesktop()) return UNAVAILABLE;
    const result = await getApi().ai.saveKey(provider, key);
    if (!result.ok) return result.error.message;
    await get().hydrate();
    return null;
  },
  removeKey: async (provider) => {
    if (!isDesktop()) return;
    await getApi().ai.removeKey(provider);
    await get().hydrate();
  },
  setModels: async (textModel, speechModel, imageModel) => {
    if (!isDesktop()) return UNAVAILABLE;
    const result = await getApi().ai.setModels({ textModel, speechModel, imageModel });
    const message = error(result);
    if (message === null) set({ textModel, speechModel, imageModel });
    return message;
  },
  restoreModels: async () => {
    if (!isDesktop()) return;
    const result = await getApi().ai.restoreModels();
    if (result.ok) set({ ...result.data });
  },
}));

/** "•••• 1234" for a saved key, "" when there is none. */
export function maskKey(last4: string): string {
  return last4 ? `•••• ${last4}` : "";
}
