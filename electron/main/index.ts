import { join } from "node:path";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { LibraryTooNewError } from "../db/migrate";
import { openLibrary, type OpenedLibrary } from "../db/connection";
import { handle } from "../ipc/register";
import { z } from "zod";
import { MediaError, MediaStore } from "../services/media";
import { handleMediaProtocol, registerMediaScheme } from "./protocol";
import { applyChange, loadLibrary, purgeTrash } from "../services/library";
import { LibraryChangeSchema } from "../shared/schemas";
import type { AppInfo, Result } from "../shared/api";
import { createMainWindow } from "./window";

let library: OpenedLibrary | null = null;
let media: MediaStore | null = null;

registerMediaScheme();

const MediaPutSchema = z.object({
  id: z.string(),
  bytes: z.instanceof(Uint8Array),
  name: z.string().max(300),
});
const MediaRemoveSchema = z.object({ id: z.string() });

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
  handle("media:put", MediaPutSchema, (input) => {
    try {
      media!.put(input.id, input.bytes, input.name);
    } catch (error) {
      // Surface the clear message of media validation errors; hide anything else.
      if (error instanceof MediaError) throw error;
      throw new Error("The file could not be stored.", { cause: error });
    }
    return null;
  });
  handle("media:remove", MediaRemoveSchema, (input) => {
    media!.remove(input.id);
    return null;
  });
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
  media = new MediaStore(library.db, join(app.getPath("userData"), "library", "media"));
  media.collectGarbage();
  handleMediaProtocol(media);
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
