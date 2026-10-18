import { app, dialog } from "electron";
import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;
const SIX_HOURS = 6 * 60 * 60 * 1000;

/**
 * Checks GitHub Releases for a newer version (installed builds only), downloads it in the background and offers to restart.
 * The library lives in the user's data folder, so an update never touches it; its format is upgraded on the next start with
 * a copy of the previous library kept.
 */
export function setupAutoUpdate(): void {
  if (!app.isPackaged) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("error", (error) => console.error("[update] failed", error.message));
  autoUpdater.on("update-downloaded", (info) => {
    void dialog
      .showMessageBox({
        type: "info",
        buttons: ["Restart now", "Later"],
        defaultId: 0,
        cancelId: 1,
        title: "Update ready",
        message: `MemBetter ${info.version} is ready to install.`,
        detail: "Your courses and progress are kept. The update is installed when you restart, or the next time you quit.",
      })
      .then((choice) => {
        if (choice.response === 0) autoUpdater.quitAndInstall();
      });
  });
  const check = () => void autoUpdater.checkForUpdates().catch(() => undefined);
  check();
  setInterval(check, SIX_HOURS).unref();
}
