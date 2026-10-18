import { isDesktop } from "../../../shared/api";
import { Button } from "../../../shared/ui/Button";
import { useExchangeStore } from "../store/exchangeStore";
import { exportLegacyData } from "../model/prototypeExport";

/** Import, export-all and (browser build only) "Export my data" for moving the prototype's data to the desktop app. */
export function LibraryToolbar() {
  const startImport = useExchangeStore((s) => s.startImport);
  const exportLibrary = useExchangeStore((s) => s.exportLibrary);

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
    </>
  );
}
