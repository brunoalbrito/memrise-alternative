import { useState } from "react";
import { isDesktop } from "../../../shared/api";
import { Button } from "../../../shared/ui/Button";
import { useExchangeStore } from "../store/exchangeStore";
import { exportLegacyData } from "../model/prototypeExport";
import { BackupDialog } from "./BackupDialog";

/** Import, export-all and (browser build only) "Export my data" for moving the prototype's data to the desktop app. */
export function LibraryToolbar() {
  const startImport = useExchangeStore((s) => s.startImport);
  const exportLibrary = useExchangeStore((s) => s.exportLibrary);
  const [backups, setBackups] = useState(false);

  if (!isDesktop()) {
    return (
      <Button variant="tonal" onClick={() => void exportLegacyData()}>
        Export my data
      </Button>
    );
  }
  return (
    <>
      <Button variant="tonal" onClick={() => void startImport()}>
        Import
      </Button>
      <Button variant="tonal" onClick={() => void exportLibrary()}>
        Export all
      </Button>
      <Button variant="tonal" onClick={() => setBackups(true)}>
        Backups
      </Button>
      {backups && <BackupDialog onClose={() => setBackups(false)} />}
    </>
  );
}
