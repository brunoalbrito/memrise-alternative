import { create } from "zustand";
import type { ExportItem, ImportChoice, ImportPreview } from "../../../../electron/shared/schemas";
import { getApi } from "../../../shared/api";
import { flushPendingSaves, useLearnerStore, useProgressStore } from "../../home";
import { exportItemFor, exportItemsForAll } from "../model/exportItems";
import type { Course } from "../../home";

export interface Notice {
  kind: "info" | "error";
  text: string;
}

interface ExchangeState {
  busy: string | null;
  progress: { done: number; total: number } | null;
  preview: ImportPreview | null;
  /** Courses waiting for the learner to confirm an export (and choose whether to include progress). */
  pendingExport: ExportItem[] | null;
  notice: Notice | null;
  dismissNotice: () => void;
  exportCourse: (course: Course) => void;
  exportLibrary: () => void;
  exportAnki: (course: Course) => Promise<void>;
  confirmExport: (includeProgress: boolean) => Promise<void>;
  cancelExport: () => void;
  /** Pick a file with the native dialog, or use `path` (drop or OS open), then show the import dialog. */
  startImport: (path?: string) => Promise<void>;
  commitImport: (choice: ImportChoice, includeProgress?: boolean) => Promise<void>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const useExchangeStore = create<ExchangeState>()((set, get) => {
  const fail = (text: string) => set({ busy: null, progress: null, notice: { kind: "error", text } });

  const runExport = async (items: ExportItem[], label: string, includeProgress: boolean) => {
    if (get().busy) return;
    // Make sure edits waiting to be saved are part of the file.
    set({ busy: label, progress: null, notice: null });
    const off = getApi().exchange.onProgress((done, total) => set({ progress: { done, total } }));
    try {
      const result = await getApi().exchange.exportItems(items, includeProgress);
      if (!result.ok) return fail(result.error.message);
      if (!result.data.saved) return set({ busy: null, progress: null });
      const missing = result.data.missingMedia > 0 ? ` ${plural(result.data.missingMedia, "file")} could not be found and ${result.data.missingMedia === 1 ? "was" : "were"} left out.` : "";
      set({
        busy: null,
        progress: null,
        notice: { kind: "info", text: `Exported ${plural(result.data.courses, "course")}.${missing}` },
      });
    } catch {
      fail("The export could not be completed.");
    } finally {
      off();
    }
  };

  return {
    busy: null,
    progress: null,
    preview: null,
    pendingExport: null,
    notice: null,
    dismissNotice: () => set({ notice: null }),
    exportCourse: (course) => set({ pendingExport: [exportItemFor(course)], notice: null }),
    exportLibrary: () => {
      const items = exportItemsForAll();
      if (items.length === 0) return set({ notice: { kind: "info", text: "There are no courses to export." } });
      set({ pendingExport: items, notice: null });
    },
    exportAnki: async (course) => {
      if (get().busy) return;
      set({ busy: "Exporting for Anki…", progress: null, notice: null });
      try {
        const result = await getApi().anki.exportDeck(exportItemFor(course));
        if (!result.ok) return fail(result.error.message);
        set({
          busy: null,
          notice: result.data.saved ? { kind: "info", text: `Exported ${plural(result.data.notes, "word")} for Anki. Open the file with Anki to import it.` } : null,
        });
      } catch {
        fail("The export could not be completed.");
      }
    },
    cancelExport: () => set({ pendingExport: null }),
    confirmExport: async (includeProgress) => {
      const items = get().pendingExport;
      set({ pendingExport: null });
      if (items) await runExport(items, "Exporting…", includeProgress);
    },
    startImport: async (path) => {
      if (get().busy || get().preview) return;
      set({ busy: "Reading file…", notice: null });
      try {
        let file = path;
        if (!file) {
          const picked = await getApi().exchange.pickFile();
          if (!picked.ok) return fail(picked.error.message);
          if (!picked.data) return set({ busy: null });
          file = picked.data;
        }
        const result = await getApi().exchange.inspect(file);
        if (!result.ok) return fail(result.error.message);
        set({ busy: null, preview: result.data });
      } catch {
        fail("The file could not be read.");
      }
    },
    commitImport: async (choice, includeProgress) => {
      const preview = get().preview;
      if (!preview) return;
      set({ preview: null, busy: choice === "cancel" ? null : "Importing…" });
      try {
        await flushPendingSaves();
        const result = await getApi().exchange.commit(preview.token, choice, includeProgress);
        if (!result.ok) return fail(result.error.message);
        if (choice === "cancel") return set({ busy: null });
        await useLearnerStore.getState().hydrate();
        await useProgressStore.getState().refresh();
        const missing = preview.missingMedia > 0 ? ` ${plural(preview.missingMedia, "file")} were missing from the file.` : "";
        set({
          busy: null,
          notice: { kind: "info", text: `Imported ${plural(result.data.imported, "course")}.${missing}` },
        });
      } catch {
        fail("The import could not be completed. Your library was not changed.");
      }
    },
  };
});
