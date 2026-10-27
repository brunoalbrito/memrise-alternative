import { create } from 'zustand';
import type { FieldName, SkippedFieldFeedback } from '../types/skipAI';

interface SkipFeedbackState {
  skippedFields: Map<string, SkippedFieldFeedback>;
  setSkippedFields: (wordId: string, fields: FieldName[]) => void;
  clearSkipped: (wordId: string) => void;
  getSkipped: (wordId: string) => FieldName[] | null;
}

export const useSkipFeedbackStore = create<SkipFeedbackState>()((set, get) => ({
  skippedFields: new Map(),

  setSkippedFields: (wordId: string, fields: FieldName[]) => {
    set((state) => {
      const newMap = new Map(state.skippedFields);
      newMap.set(wordId, {
        wordId,
        skippedFields: fields,
        displayUntil: Date.now() + 5000, // Show for 5 seconds
      });
      return { skippedFields: newMap };
    });
  },

  clearSkipped: (wordId: string) => {
    set((state) => {
      const newMap = new Map(state.skippedFields);
      newMap.delete(wordId);
      return { skippedFields: newMap };
    });
  },

  getSkipped: (wordId: string) => {
    const feedback = get().skippedFields.get(wordId);
    if (!feedback) return null;
    if (feedback.displayUntil && Date.now() > feedback.displayUntil) {
      get().clearSkipped(wordId);
      return null;
    }
    return feedback.skippedFields;
  },
}));
