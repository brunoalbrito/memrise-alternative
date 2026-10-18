import { useCallback, useEffect, useRef, useState } from "react";
import type { BackupConfigData, BackupEntryData } from "../../../../electron/shared/api";
import { getApi } from "../../../shared/api";
import { Button } from "../../../shared/ui/Button";
import { flushPendingSaves } from "../../home";

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const size = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const select =
  "rounded-m3-sm border border-outline bg-surface px-3 py-2 text-body-large text-on-surface focus:border-2 focus:border-primary focus:outline-none";

/** Backup settings, "Back up now", and restoring from a backup. */
export function BackupDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [config, setConfig] = useState<BackupConfigData | null>(null);
  const [entries, setEntries] = useState<BackupEntryData[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<BackupEntryData | null>(null);

  const load = useCallback(async () => {
    const [c, l] = await Promise.all([getApi().backup.getConfig(), getApi().backup.list()]);
    if (c.ok) setConfig(c.data);
    if (l.ok) setEntries(l.data);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const update = async (patch: Parameters<ReturnType<typeof getApi>["backup"]["setConfig"]>[0]) => {
    // Shown at once; the saved value replaces it when the main process answers.
    setConfig((current) => (current ? { ...current, ...patch } : current));
    const result = await getApi().backup.setConfig(patch);
    if (result.ok) setConfig(result.data);
    else setStatus(result.error.message);
    await load();
  };

  const backUpNow = async () => {
    setBusy(true);
    setStatus("Backing up…");
    await flushPendingSaves();
    const result = await getApi().backup.runNow();
    setBusy(false);
    setStatus(result.ok ? "Backup saved." : result.error.message);
    await load();
  };

  const chooseFolder = async () => {
    const picked = await getApi().backup.chooseFolder();
    if (picked.ok && picked.data) await update({ folder: picked.data });
  };

  const restore = async (entry: BackupEntryData) => {
    setBusy(true);
    setStatus("Restoring…");
    await flushPendingSaves();
    const result = await getApi().backup.restore(entry.id);
    if (!result.ok) {
      setBusy(false);
      setConfirming(null);
      setStatus(result.error.message);
    }
    // On success the app restarts with the restored library.
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="backup-title"
      className="m-auto max-h-[90vh] w-[min(92vw,34rem)] overflow-y-auto rounded-m3-xl bg-surface-container-high p-6 text-on-surface shadow-m3-3 backdrop:bg-scrim"
    >
      <h2 id="backup-title" className="text-title-large">
        Backups
      </h2>
      <p className="mt-2 text-body-medium text-on-surface-variant">
        A backup is a copy of all your courses, progress and pictures. Your AI keys are never included.
      </p>

      {config && (
        <div className="mt-4 flex flex-col gap-3">
          {config.lastError && (
            <p role="alert" className="rounded-m3-sm bg-error-container px-3 py-2 text-body-medium text-on-error-container">
              The last backup did not work: {config.lastError}
            </p>
          )}
          <label className="flex min-h-10 items-center gap-3 text-body-large">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) => void update({ enabled: event.target.checked })}
              className="size-5 accent-primary"
            />
            Back up automatically
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-body-medium">
              Every
              <select
                className={select}
                value={config.intervalDays}
                disabled={!config.enabled}
                onChange={(event) => void update({ intervalDays: Number(event.target.value) as 1 | 3 | 7 })}
              >
                <option value={1}>day</option>
                <option value={3}>3 days</option>
                <option value={7}>week</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-body-medium">
              Keep the last
              <select className={select} value={config.keep} onChange={(event) => void update({ keep: Number(event.target.value) })}>
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="text-label-large font-medium">Folder</div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <code className="min-w-0 break-all rounded-m3-sm bg-surface-container px-2 py-1 text-body-medium">{config.folder}</code>
              <Button variant="tonal" onClick={() => void chooseFolder()}>
                Change folder…
              </Button>
            </div>
          </div>
          <p className="text-body-medium text-on-surface-variant">
            {config.lastAt ? `Last backup: ${when(config.lastAt)}` : "No backup yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="filled" disabled={busy} onClick={() => void backUpNow()}>
              Back up now
            </Button>
          </div>
        </div>
      )}

      <p aria-live="polite" className="mt-3 min-h-6 text-body-medium">
        {status}
      </p>

      <h3 className="mt-2 text-title-medium">Restore</h3>
      {entries.length === 0 ? (
        <p className="mt-1 text-body-medium text-on-surface-variant">There are no backups in this folder yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-outline-variant">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3 py-2">
              <span className="min-w-0 flex-1 text-body-medium">
                {when(entry.createdAt)} <span className="text-on-surface-variant">· {size(entry.sizeBytes)}</span>
              </span>
              <Button variant="text" disabled={busy} onClick={() => setConfirming(entry)}>
                Restore
              </Button>
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <div role="alertdialog" aria-label="Confirm restore" className="mt-4 rounded-m3-md bg-surface-container p-4">
          <p className="text-body-medium">
            Replace your library with the backup from <strong>{when(confirming.createdAt)}</strong>? Changes made after that time will be
            lost. A copy of your current library is kept, and the app restarts.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="text" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button variant="filled" disabled={busy} onClick={() => void restore(confirming)}>
              Replace my library
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="text" onClick={() => dialogRef.current?.close()}>
          Close
        </Button>
      </div>
    </dialog>
  );
}
