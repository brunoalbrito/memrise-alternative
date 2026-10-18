import { useEffect, useRef } from "react";
import type { ImportPreview } from "../../../../electron/shared/schemas";
import { Button } from "../../../shared/ui/Button";
import { useExchangeStore } from "../store/exchangeStore";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function ImportDialog({ preview }: { preview: ImportPreview }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const commit = useExchangeStore((s) => s.commitImport);
  const conflicts = preview.courses.filter((c) => c.conflict).length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        void commit("cancel");
      }}
      aria-labelledby="import-title"
      className="m-auto w-[min(92vw,28rem)] rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="import-title" className="text-title-large">
        {preview.kind === "library" ? "Import library?" : "Import course?"}
      </h2>
      <ul className="mt-3 max-h-60 overflow-auto text-body-medium">
        {preview.courses.map((course, index) => (
          <li key={index} className="py-1">
            <span className="font-medium">{course.title}</span>
            <span className="text-on-surface-variant">
              {" "}
              · {plural(course.levels, "level")}, {plural(course.words, "word")}
              {course.media > 0 && `, ${plural(course.media, "file")}`}
            </span>
            {course.conflict && <span className="text-error"> · already in your library</span>}
          </li>
        ))}
      </ul>
      {preview.missingMedia > 0 && (
        <p className="mt-3 text-body-medium text-on-surface-variant">
          {plural(preview.missingMedia, "file")} referenced by the file {preview.missingMedia === 1 ? "is" : "are"} missing and will be left out.
        </p>
      )}
      {conflicts > 0 && (
        <p className="mt-3 text-body-medium text-on-surface-variant">
          Replace overwrites the existing {conflicts === 1 ? "course" : "courses"}. Import as copy keeps both.
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="text" onClick={() => void commit("cancel")}>
          Cancel
        </Button>
        {conflicts > 0 ? (
          <>
            <Button variant="text" onClick={() => void commit("copy")}>
              Import as copy
            </Button>
            <Button variant="filled" onClick={() => void commit("replace")}>
              Replace
            </Button>
          </>
        ) : (
          <Button variant="filled" onClick={() => void commit("replace")}>
            Import
          </Button>
        )}
      </div>
    </dialog>
  );
}
