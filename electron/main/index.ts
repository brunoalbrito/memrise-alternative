import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { LibraryTooNewError } from "../db/migrate";
import { openLibrary, type OpenedLibrary } from "../db/connection";
import { handle } from "../ipc/register";
import { z } from "zod";
import { MediaError, MediaStore } from "../services/media";
import { handleMediaProtocol, registerMediaScheme } from "./protocol";
import { ExchangeError, importArchive, previewOf, readArchive, writeArchive, type ParsedArchive } from "../services/exchange";
import { CsvImportSchema, importCsv, previewCsv, writeApkg } from "../services/anki";
import { Backups, restoreBackup } from "../services/backup";
import { BackupConfigPatchSchema, BackupIdSchema } from "../shared/schemas";
import { AiService } from "../services/ai/service";
import { Secrets } from "../services/secrets";
import { Settings } from "../services/settings";
import { osCipher, shrinkImage } from "./secureStorage";
import { CourseIdSchema, EndSessionSchema, MarkSchema, NewPerDaySchema, OutcomeSchema, PlanSchema, Study, StartSessionSchema } from "../services/study";
import { applyChange, loadLibrary, purgeTrash } from "../services/library";
import { ExportItemSchema, ExportItemsSchema, ImportChoiceSchema, LibraryChangeSchema } from "../shared/schemas";
import type { AppInfo, Result } from "../shared/api";
import { setupAutoUpdate } from "./updater";
import { createMainWindow } from "./window";

// `pnpm dev` keeps its own data folder, so development never touches the data of an installed MemBetter
// (tests pass --user-data-dir and are left alone). `pnpm dev:reset` empties it.
if (!app.isPackaged && !process.argv.some((arg) => arg.startsWith("--user-data-dir"))) {
  app.setPath("userData", join(app.getPath("appData"), "MemBetter-dev"));
}

let library: OpenedLibrary | null = null;
let media: MediaStore | null = null;
let secrets: Secrets | null = null;
let ai: AiService | null = null;
let study: Study | null = null;
let backups: Backups | null = null;
let backupTimer: ReturnType<typeof setInterval> | null = null;

registerMediaScheme();

const MediaPutSchema = z.object({
  id: z.string(),
  bytes: z.instanceof(Uint8Array),
  name: z.string().max(300),
});
/**
 * Files and folders the renderer may ask the main process to use must come from a native dialog (or the operating system),
 * so a compromised renderer cannot make the app read or write arbitrary places.
 */
let pickedCsv: string | null = null;
const pickedFolders = new Set<string>();
const chooseAgain = () => new ExchangeError("validation_failed", "Choose the file again.");

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

const ProviderSchema = z.enum(["google", "pollinations"]);
const KeySchema = z.object({ provider: ProviderSchema, key: z.string().trim().min(1).max(500).regex(/^\S+$/, "Enter your API key without spaces.") });
const ProviderOnlySchema = z.object({ provider: ProviderSchema });
const modelName = z.string().trim().max(200).regex(/^\S*$/, "Enter model names without spaces.");
const ModelsSchema = z.object({ textModel: modelName.min(1), speechModel: modelName.min(1), pollinationsModel: modelName });
const WordTextSchema = z.object({ word: z.string().trim().min(1).max(200), languageName: z.string().trim().min(1).max(100) });
const WordOnlySchema = z.object({ word: z.string().trim().min(1).max(200) });
const WordImageSchema = z.object({ word: z.string().trim().min(1).max(200), sentence: z.string().trim().min(1).max(1000) });

const MediaRemoveSchema = z.object({ id: z.string() });

function registerIpc(): void {
  ipcMain.handle("app:info", (): Result<AppInfo> => ({
    ok: true,
    data: {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      libraryVersion: library?.version ?? 0,
      dataPath: join(app.getPath("userData"), "library"),
    },
  }));
  handle("app:openDataFolder", null, async () => {
    await shell.openPath(join(app.getPath("userData"), "library"));
    return null;
  });
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
  handle("exchange:export", ExportItemsSchema, async ({ items, includeProgress }) => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const suggested = items.length === 1 ? items[0]!.course.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "course" : "MemBetter library";
    const options = { title: "Export", defaultPath: `${suggested}.membetter`, filters: FILE_FILTER };
    const choice = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (choice.canceled || !choice.filePath) return { saved: false, courses: 0, missingMedia: 0 };
    const path = choice.filePath.endsWith(".membetter") ? choice.filePath : `${choice.filePath}.membetter`;
    const result = await writeArchive(
      items,
      media!,
      path,
      (done, total) => win?.webContents.send("exchange:progress", done, total),
      undefined,
      includeProgress ? study! : undefined,
    );
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
    if (!/\.membetter$/i.test(path)) throw new ExchangeError("validation_failed", "Choose a .membetter file.");
    const parsed = readArchive(path);
    const token = randomUUID();
    staged = { token, parsed };
    return previewOf(library!.db, parsed, token);
  });
  handle("exchange:commit", ImportChoiceSchema, ({ token, choice, includeProgress }) => {
    const current = staged;
    staged = null;
    if (!current || current.token !== token) throw new ExchangeError("validation_failed", "Choose the file again.");
    if (choice === "cancel") return { imported: 0 };
    return { imported: importArchive(library!.db, media!, current.parsed, choice, includeProgress ? study! : undefined) };
  });
  ipcMain.on("exchange:ready", () => {
    rendererReady = true;
    if (pendingOpenFile) {
      openFileInRenderer(pendingOpenFile);
      pendingOpenFile = null;
    }
  });
  handle("ai:status", null, () => ({
    google: secrets!.status("google"),
    pollinations: secrets!.status("pollinations"),
    models: ai!.models(),
    weakProtection: secrets!.weakProtection(),
  }));
  handle("ai:saveKey", KeySchema, ({ provider, key }) => {
    secrets!.save(provider, key);
    return null;
  });
  handle("ai:removeKey", ProviderOnlySchema, ({ provider }) => {
    secrets!.remove(provider);
    return null;
  });
  handle("ai:testGoogle", null, async () => {
    await ai!.testGoogle();
    return null;
  });
  handle("ai:setModels", ModelsSchema, (models) => {
    ai!.setModels(models);
    return null;
  });
  handle("ai:restoreModels", null, () => ai!.restoreModels());
  handle("ai:wordText", WordTextSchema, ({ word, languageName }) => ai!.wordText(word, languageName));
  handle("ai:wordAudio", WordOnlySchema, ({ word }) => ai!.wordAudio(word));
  handle("ai:wordImage", WordImageSchema, ({ word, sentence }) => ai!.wordImage(word, sentence));
  handle("study:start", StartSessionSchema, (input) => study!.start(input));
  handle("study:answer", OutcomeSchema, (outcome) => study!.answer(outcome));
  handle("study:plan", PlanSchema, (input) => study!.plan(input));
  handle("study:progress", null, () => study!.progress());
  handle("study:stats", CourseIdSchema, ({ courseId }) => study!.stats(courseId));
  handle("study:mark", MarkSchema, (input) => {
    study!.mark(input);
    return null;
  });
  handle("study:setNewPerDay", NewPerDaySchema, ({ courseId, value }) => {
    study!.setNewPerDay(courseId, value);
    return null;
  });
  handle("study:end", EndSessionSchema, ({ sessionId, status }) => study!.end(sessionId, status));
  handle("anki:export", z.object({ item: ExportItemSchema }), async ({ item }) => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const suggested = item.course.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "course";
    const options = { title: "Export for Anki", defaultPath: `${suggested}.apkg`, filters: [{ name: "Anki package", extensions: ["apkg"] }] };
    const choice = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options);
    if (choice.canceled || !choice.filePath) return { saved: false, notes: 0 };
    const path = choice.filePath.endsWith(".apkg") ? choice.filePath : `${choice.filePath}.apkg`;
    const result = await writeApkg(item, media!, path);
    return { saved: true, notes: result.notes };
  });
  handle("anki:pickCsv", null, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const options = { title: "Import word list", properties: ["openFile" as const], filters: [{ name: "Word list", extensions: ["csv", "tsv", "txt"] }] };
    const choice = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    pickedCsv = choice.canceled ? null : (choice.filePaths[0] ?? null);
    return pickedCsv;
  });
  handle("anki:previewCsv", InspectSchema, ({ path }) => {
    if (path !== pickedCsv) throw chooseAgain();
    return previewCsv(path);
  });
  handle("anki:importCsv", CsvImportSchema, (input) => {
    if (input.path !== pickedCsv) throw chooseAgain();
    return importCsv(library!.db, input);
  });
  handle("backup:getConfig", null, () => backups!.config());
  handle("backup:setConfig", BackupConfigPatchSchema, (patch) => {
    if (patch.folder !== undefined && patch.folder !== backups!.config().folder && !pickedFolders.has(patch.folder)) {
      throw new ExchangeError("validation_failed", "Choose the folder again.");
    }
    return backups!.setConfig(patch);
  });
  handle("backup:chooseFolder", null, async () => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const options = { title: "Choose a backup folder", properties: ["openDirectory" as const, "createDirectory" as const] };
    const choice = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    const folder = choice.canceled ? null : (choice.filePaths[0] ?? null);
    if (folder) pickedFolders.add(folder);
    return folder;
  });
  handle("backup:runNow", null, () => backups!.create());
  handle("backup:list", null, () => backups!.list());
  handle("backup:restore", BackupIdSchema, ({ id }) => {
    const libraryDir = join(app.getPath("userData"), "library");
    restoreBackup({
      backups: backups!,
      id,
      libraryDir,
      mediaDir: join(libraryDir, "media"),
      currentSettingsRows: library!.db.prepare("SELECT key, value FROM settings WHERE key LIKE 'ai.%Key.%'").all() as { key: string; value: string }[],
      closeDb: () => library!.db.close(),
    });
    // The restored library is opened by a fresh start.
    app.relaunch();
    app.exit(0);
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
  study = new Study(library.db);
  study.abandonOpenSessions();
  const settings = new Settings(library.db);
  secrets = new Secrets(settings, osCipher);
  ai = new AiService(secrets, settings, shrinkImage);
  backups = new Backups(
    library.db,
    settings,
    join(app.getPath("userData"), "library", "media"),
    process.env["MEMBETTER_BACKUP_FOLDER"] ??
      (app.isPackaged ? join(app.getPath("documents"), "MemBetter Backups") : join(app.getPath("userData"), "backups")),
  );
  // Automatic backups run in the background and never block the app; a failure is remembered and shown as a warning.
  void backups.runIfDue();
  backupTimer = setInterval(() => void backups?.runIfDue(), 60 * 60 * 1000);
  handleMediaProtocol(media);
  registerIpc();
  createMainWindow();
  setupAutoUpdate();
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
  app.on("will-quit", () => {
    if (backupTimer) clearInterval(backupTimer);
    library?.db.close();
  });
}
