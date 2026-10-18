import { create } from "zustand";
import { getApi, isDesktop } from "../../../shared/api";
import type { ProgressCards, WordProgress } from "../model/progress";

interface ProgressState {
  /** True in the desktop app once progress has been loaded; the browser build has no real progress. */
  loaded: boolean;
  cards: ProgressCards;
  practicedToday: Record<string, number>;
  newPerDay: Record<string, number>;
  /** Time the numbers were read, used to decide what is due. */
  asOf: number;
  refresh: () => Promise<void>;
  /** Shows a change to some words at once, before the main process has confirmed it. */
  patchCards: (wordIds: string[], patch: Partial<Pick<WordProgress, "ignored" | "longTerm">>) => void;
}

export const DEFAULT_NEW_PER_DAY = 10;

export const useProgressStore = create<ProgressState>()((set) => ({
  patchCards: (wordIds, patch) =>
    set((state) => {
      const cards = { ...state.cards };
      for (const id of wordIds) {
        const base: WordProgress = cards[id] ?? { learned: false, lapses: 0, dueAt: "", ignored: false, longTerm: false };
        cards[id] = { ...base, ...patch };
      }
      return { cards };
    }),
  loaded: false,
  cards: {},
  practicedToday: {},
  newPerDay: {},
  asOf: Date.now(),
  refresh: async () => {
    if (!isDesktop()) return;
    try {
      const result = await getApi().study.progress();
      if (!result.ok) return;
      set({ loaded: true, asOf: Date.now(), ...result.data });
    } catch {
      /* keep what is shown; the next refresh tries again */
    }
  },
}));
