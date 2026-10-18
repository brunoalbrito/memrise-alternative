import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { LibraryTooNewError } from "../db/migrate";
import { openLibrary, type OpenedLibrary } from "../db/connection";
import { handle } from "../ipc/register";
import { z } from "zod";
import { MediaError, MediaStore } from "../services/media";
import { handleMediaProtocol, registerMediaScheme } from "./protocol";
import { ExchangeError, importArchive, previewOf, readArchive, writeArchive, type ParsedArchive } from "../services/exchange";
import { applyChange, loadLibrary, purgeTrash } from "../services/library";
import { ExportItemsSchema, ImportChoiceSchema, LibraryChangeSchema } from "../shared/schemas";
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
const InspectSchema = z.object({ path: z.string().min(1).max(4096) });

/** The one file waiting for the user's choice; only main holds it. */
let staged: { token: string; parsed: ParsedArchive } | null = null;

const FILE_FILTER = [{ name: "MemBetter course", extensions: ["membetter"] }];
let pendingOpenFile: string | null = null;
let rendererReady = false;

function openFileInRenderer(path: string): void {
  const win = BrowserWindow.getAllWindows()[0];
  if (win && rendererReady) win.webContents.send("exchange:open-file", path);
  else pendingOpenFile = path;
}

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
  handle("exchange:export", ExportItemsSchema, async ({ items }) => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const suggested = items.length === 1 ? items[0]!.course.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "course" : "MemBetter library";
    const options = { title: "Export", defaultPath: `${suggested}.membetter`, filters: FILE_FILTER };
    const choice = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (choice.canceled || !choice.filePath) return { saved: false, courses: 0, missingMedia: 0 };
    const path = choice.filePath.endsWith(".membetter") ? choice.filePath : `${choice.filePath}.membetter`;
    const result = await writeArchive(items, media!, path, (done, total) => win?.webContents.send("exchange:progress", done, total));
    return { saved: true, path, ...result };
  });
  handle("exchange:pickFile", null, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const options = { title: "Import", properties: ["openFile" as const], filters: FILE_FILTER };
    const choice = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    return choice.canceled ? null : (choice.filePaths[0] ?? null);
  });
  handle("exchange:inspect", InspectSchema, ({ path }) => {
    staged = null;
    const parsed = readArchive(path);
    const token = randomUUID();
    staged = { token, parsed };
    return previewOf(library!.db, parsed, token);
  });
  handle("exchange:commit", ImportChoiceSchema, ({ token, choice }) => {
    const current = staged;
    staged = null;
    if (!current || current.token !== token) throw new ExchangeError("validation_failed", "Choose the file again.");
    if (choice === "cancel") return { imported: 0 };
    return { imported: importArchive(library!.db, media!, current.parsed, choice) };
  });
  ipcMain.on("exchange:ready", () => {
    rendererReady = true;
    if (pendingOpenFile) {
      openFileInRenderer(pendingOpenFile);
      pendingOpenFile = null;
    }
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
  const fromArgv = (argv: string[]) => argv.find((a) => a.endsWith(".membetter"));
  const initial = fromArgv(process.argv.slice(1));
  if (initial) pendingOpenFile = initial;
  app.on("open-file", (event, path) => {
    event.preventDefault();
    openFileInRenderer(path);
  });
  app.on("second-instance", (_event, argv) => {
    const file = fromArgv(argv.slice(1));
    if (file) openFileInRenderer(file);
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
