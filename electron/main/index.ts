import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { LibraryTooNewError } from "../db/migrate";
import { openLibrary, type OpenedLibrary } from "../db/connection";
import { handle } from "../ipc/register";
import { applyChange, loadLibrary, purgeTrash } from "../services/library";
import { LibraryChangeSchema } from "../shared/schemas";
import type { AppInfo, Result } from "../shared/api";
import { createMainWindow } from "./window";

let library: OpenedLibrary | null = null;

function registerIpc(): void {
  ipcMain.handle("app:info", (): Result<AppInfo> => ({
    ok: true,
    data: {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      libraryVersion: library?.version ?? 0,
    },
  }));
  handle("library:load", null, () => loadLibrary(library!.db));
  handle("library:apply", LibraryChangeSchema, (change) => {
    applyChange(library!.db, change);
    return null;
  });
}

function start(): void {
  try {
    library = openLibrary(join(app.getPath("userData"), "library", "membetter.db"));
  } catch (error) {
    const message =
      error instanceof LibraryTooNewError
        ? error.message
        : "The library could not be opened. Your data was not changed.";
    dialog.showErrorBox("MemBetter", message);
    app.exit(1);
    return;
  }
  purgeTrash(library.db);
  registerIpc();
  createMainWindow();
}

// Only one instance may open the library at a time.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  void app.whenReady().then(() => {
    start();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("will-quit", () => library?.db.close());
}
