import { useEffect } from "react";
import { getApi } from "../../../shared/api";
import { useExchangeStore } from "../store/exchangeStore";
import { ExportDialog } from "./ExportDialog";
import { ImportDialog } from "./ImportDialog";

/** Mounted once in the desktop app: drag and drop, "open with", progress and result messages. */
export function LibraryHost() {
  const busy = useExchangeStore((s) => s.busy);
  const progress = useExchangeStore((s) => s.progress);
  const preview = useExchangeStore((s) => s.preview);
  const pendingExport = useExchangeStore((s) => s.pendingExport);
  const notice = useExchangeStore((s) => s.notice);
  const dismiss = useExchangeStore((s) => s.dismissNotice);
  const startImport = useExchangeStore((s) => s.startImport);

  useEffect(() => {
    const api = getApi().exchange;
    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      const file = event.dataTransfer?.files[0];
      if (!file) return;
      event.preventDefault();
      const path = api.pathForFile(file);
      if (path.endsWith(".membetter")) void startImport(path);
      else useExchangeStore.setState({ notice: { kind: "error", text: "Drop a .membetter file to import a course." } });
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    const offOpen = api.onOpenFile((path) => void startImport(path));
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      offOpen();
    };
  }, [startImport]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismiss, 8000);
    return () => clearTimeout(timer);
  }, [notice, dismiss]);

  return (
    <>
      {preview && <ImportDialog preview={preview} />}
      {pendingExport && <ExportDialog count={pendingExport.length} />}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4" role="status" aria-live="polite">
        {(busy || notice) && (
          <div
            className={`pointer-events-auto flex max-w-lg items-center gap-3 rounded-m3-sm px-4 py-3 text-body-medium shadow-m3-3 ${
              notice?.kind === "error" && !busy
                ? "bg-error-container text-on-error-container"
                : "bg-inverse-surface text-inverse-on-surface"
            }`}
          >
            <span>
              {busy
                ? `${busy}${progress ? ` ${progress.done}/${progress.total}` : ""}`
                : notice?.text}
            </span>
            {!busy && notice && (
              <button type="button" onClick={dismiss} className="font-medium underline">
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
