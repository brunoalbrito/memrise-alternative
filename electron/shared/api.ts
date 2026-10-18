import type {
  ExportItem,
  ExportOutcome,
  ImportChoice,
  ImportOutcome,
  ImportPreview,
  LibraryChange,
  LibrarySnapshot,
} from "./schemas";

/** Result envelope returned by every `window.api` call. */
export type ApiError = { code: string; message: string };
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  libraryVersion: number;
}

/** Surface exposed to the renderer by the preload script. Grows with each feature. */
export interface MembetterApi {
  app: {
    info(): Promise<Result<AppInfo>>;
  };
  media: {
    /** Validate and store a file under `id`. Fails with a clear message when the type or size is not allowed. */
    put(id: string, bytes: Uint8Array, name: string): Promise<Result<null>>;
    remove(id: string): Promise<Result<null>>;
  };
  exchange: {
    /** Ask where to save, then write a .membetter file with these courses (one course, or a whole library). */
    exportItems(items: ExportItem[]): Promise<Result<ExportOutcome>>;
    /** Show the native open dialog. Returns the chosen path, or null. */
    pickFile(): Promise<Result<string | null>>;
    /** Read and validate a file without changing the library. */
    inspect(path: string): Promise<Result<ImportPreview>>;
    /** Apply a previously inspected file. */
    commit(token: string, choice: ImportChoice): Promise<Result<ImportOutcome>>;
    /** Local path of a dropped file. */
    pathForFile(file: File): string;
    /** Called when the OS asks the app to open a .membetter file. Returns an unsubscribe function. */
    onOpenFile(callback: (path: string) => void): () => void;
    /** Progress of a running export. */
    onProgress(callback: (done: number, total: number) => void): () => void;
  };
  library: {
    /** Everything the learner has stored. */
    load(): Promise<Result<LibrarySnapshot>>;
    /** Persist one change atomically. */
    apply(change: LibraryChange): Promise<Result<null>>;
  };
}
