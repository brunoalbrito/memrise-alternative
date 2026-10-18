import { useEffect, useRef, useState } from "react";
import type { CsvImportResult, CsvPreviewData } from "../../../../electron/shared/api";
import { getApi } from "../../../shared/api";
import { Button } from "../../../shared/ui/Button";
import { DEFAULT_SPEAKERS_LANGUAGE_ID, languages, useLearnerStore } from "../../home";

const field =
  "w-full rounded-m3-sm border border-outline bg-surface px-3 py-2 text-body-large text-on-surface focus:border-2 focus:border-primary focus:outline-none";

const baseName = (path: string) => (path.split(/[\\/]/).pop() ?? "").replace(/\.[^.]+$/, "");

/** Turns a CSV or tab-separated word list into a new course: choose the file, the columns and the languages. */
export function CsvImportDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [path, setPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<CsvPreviewData | null>(null);
  const [hasHeader, setHasHeader] = useState(false);
  const [word, setWord] = useState(0);
  const [meaning, setMeaning] = useState<number | null>(1);
  const [example, setExample] = useState<number | null>(null);
  const [ipa, setIpa] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [teaching, setTeaching] = useState("");
  const [speakers, setSpeakers] = useState(DEFAULT_SPEAKERS_LANGUAGE_ID);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const choose = async () => {
    setError("");
    const picked = await getApi().anki.pickCsv();
    if (!picked.ok) return setError(picked.error.message);
    if (!picked.data) return;
    const info = await getApi().anki.previewCsv(picked.data);
    if (!info.ok) return setError(info.error.message);
    setPath(picked.data);
    setPreview(info.data);
    setHasHeader(info.data.looksLikeHeader);
    setWord(0);
    setMeaning(info.data.columns > 1 ? 1 : null);
    setExample(null);
    setIpa(null);
    setTitle(baseName(picked.data).slice(0, 100));
  };

  const run = async () => {
    if (!path) return;
    setBusy(true);
    setError("");
    const outcome = await getApi().anki.importCsv({
      path,
      hasHeader,
      mapping: { word, meaning, example, ipa },
      title,
      teachingLanguageId: teaching,
      speakersLanguageId: speakers,
    });
    setBusy(false);
    if (!outcome.ok) return setError(outcome.error.message);
    setResult(outcome.data);
    await useLearnerStore.getState().hydrate();
  };

  const columnOptions = (optional: boolean) => (
    <>
      {optional && <option value="">None</option>}
      {Array.from({ length: preview?.columns ?? 0 }, (_, i) => (
        <option key={i} value={i}>
          {`Column ${i + 1}${preview?.sample[0]?.[i] ? `: ${preview.sample[0][i]!.slice(0, 24)}` : ""}`}
        </option>
      ))}
    </>
  );
  const pick = (set: (value: number | null) => void) => (event: React.ChangeEvent<HTMLSelectElement>) =>
    set(event.target.value === "" ? null : Number(event.target.value));

  const canImport = path !== null && title.trim().length >= 3 && teaching !== "" && !busy;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="csv-title"
      className="m-auto max-h-[90vh] w-[min(92vw,36rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="csv-title" className="text-title-large">
        Import a word list
      </h2>

      {result ? (
        <div className="mt-3">
          <p className="text-body-large">
            Imported {result.imported} {result.imported === 1 ? "word" : "words"} into <strong>{title}</strong>.
          </p>
          {result.skipped.length > 0 && (
            <>
              <p className="mt-3 text-body-medium text-on-surface-variant">
                {result.skipped.length} {result.skipped.length === 1 ? "row was" : "rows were"} skipped:
              </p>
              <ul className="mt-1 max-h-48 overflow-auto text-body-medium">
                {result.skipped.slice(0, 100).map((s) => (
                  <li key={s.row}>
                    Row {s.row}: {s.reason}
                  </li>
                ))}
              </ul>
              {result.skipped.length > 100 && <p className="text-body-medium text-on-surface-variant">…and {result.skipped.length - 100} more.</p>}
            </>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="filled" onClick={() => dialogRef.current?.close()}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-2 text-body-medium text-on-surface-variant">
            Choose a CSV, TSV or text file with one word per row. A new course is created from it.
          </p>
          <div className="mt-3">
            <Button variant="tonal" onClick={() => void choose()}>
              {path ? "Choose another file…" : "Choose file…"}
            </Button>
            {path && <span className="ml-3 break-all text-body-medium text-on-surface-variant">{baseName(path)}</span>}
          </div>

          {preview && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-body-medium text-on-surface-variant">
                {preview.totalRows} {preview.totalRows === 1 ? "row" : "rows"}, {preview.columns} {preview.columns === 1 ? "column" : "columns"}.
              </p>
              <div className="overflow-auto rounded-m3-sm border border-outline-variant">
                <table className="w-full text-left text-body-medium">
                  <caption className="sr-only">First rows of the file</caption>
                  <tbody>
                    {preview.sample.map((row, r) => (
                      <tr key={r} className={r === 0 && hasHeader ? "bg-surface-container font-medium" : ""}>
                        {Array.from({ length: preview.columns }, (_, c) => (
                          <td key={c} className="max-w-40 truncate px-2 py-1">
                            {row[c] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex min-h-10 items-center gap-3 text-body-medium">
                <input type="checkbox" checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)} className="size-5 accent-primary" />
                The first row holds column names
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-label-large font-medium">
                  Word
                  <select className={`${field} mt-1`} value={word} onChange={(e) => setWord(Number(e.target.value))}>
                    {columnOptions(false)}
                  </select>
                </label>
                <label className="text-label-large font-medium">
                  Meaning
                  <select className={`${field} mt-1`} value={meaning ?? ""} onChange={pick(setMeaning)}>
                    {columnOptions(true)}
                  </select>
                </label>
                <label className="text-label-large font-medium">
                  Example
                  <select className={`${field} mt-1`} value={example ?? ""} onChange={pick(setExample)}>
                    {columnOptions(true)}
                  </select>
                </label>
                <label className="text-label-large font-medium">
                  IPA
                  <select className={`${field} mt-1`} value={ipa ?? ""} onChange={pick(setIpa)}>
                    {columnOptions(true)}
                  </select>
                </label>
              </div>
              <label className="text-label-large font-medium">
                Course name
                <input className={`${field} mt-1`} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-label-large font-medium">
                  Language you are learning
                  <select className={`${field} mt-1`} value={teaching} onChange={(e) => setTeaching(e.target.value)}>
                    <option value="">Please select one…</option>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-label-large font-medium">
                  Your language
                  <select className={`${field} mt-1`} value={speakers} onChange={(e) => setSpeakers(e.target.value)}>
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 text-body-medium text-error">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="text" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <Button variant="filled" disabled={!canImport} onClick={() => void run()}>
              {busy ? "Importing…" : "Import"}
            </Button>
          </div>
        </>
      )}
    </dialog>
  );
}
