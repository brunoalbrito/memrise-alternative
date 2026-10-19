import { create } from "zustand";
import { getApi, isDesktop } from "../../../shared/api";
import { EXERCISE_KINDS, type ExerciseKind } from "../model/exercises";

interface ExerciseSettingsState {
  /** Exercise types that are turned on (all of them until the learner changes it). */
  enabled: readonly ExerciseKind[];
  hydrate: () => Promise<void>;
  /** Saves the choice. Returns a message when it was refused. */
  setEnabled: (kinds: ExerciseKind[]) => Promise<string | null>;
}

export const useExerciseSettings = create<ExerciseSettingsState>()((set, get) => ({
  enabled: EXERCISE_KINDS,
  hydrate: async () => {
    if (!isDesktop()) return;
    try {
      const result = await getApi().study.exerciseSettings();
      if (result.ok) set({ enabled: result.data });
    } catch {
      /* keep the default */
    }
  },
  setEnabled: async (kinds) => {
    if (kinds.length === 0) return "Keep at least one exercise type on.";
    const before = get().enabled;
    set({ enabled: kinds });
    if (!isDesktop()) return null;
    const result = await getApi().study.setExerciseSettings(kinds);
    if (!result.ok) {
      set({ enabled: before });
      return result.error.message;
    }
    return null;
  },
}));
