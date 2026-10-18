import { create } from "zustand";
import { getApi, isDesktop } from "../../../shared/api";
import type { ProgressCards } from "../model/progress";

interface ProgressState {
  /** True in the desktop app once progress has been loaded; the browser build has no real progress. */
  loaded: boolean;
  cards: ProgressCards;
  practicedToday: Record<string, number>;
  newPerDay: Record<string, number>;
  /** Time the numbers were read, used to decide what is due. */
  asOf: number;
  refresh: () => Promise<void>;
}

export const DEFAULT_NEW_PER_DAY = 10;

export const useProgressStore = create<ProgressState>()((set) => ({
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
