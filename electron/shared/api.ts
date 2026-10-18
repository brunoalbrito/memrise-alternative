import type {
  ExportItem,
  ExportOutcome,
  ImportChoice,
  ImportOutcome,
  ImportPreview,
  LibraryChange,
  LibrarySnapshot,
} from "./schemas";

export type AiProvider = "google" | "pollinations";

export interface AiStatus {
  google: { connected: boolean; last4: string };
  pollinations: { connected: boolean; last4: string };
  models: { textModel: string; speechModel: string; pollinationsModel: string };
  /** The operating system only offers weak protection for saved keys. */
  weakProtection: boolean;
}

export interface WordText {
  definition: string;
  sentences: string[];
  best: number;
  ipa: string;
}

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
  ai: {
    /** Which keys are saved (never the keys themselves) and the model names. */
    status(): Promise<Result<AiStatus>>;
    /** Keys are write-only: they are stored encrypted and never returned. */
    saveKey(provider: AiProvider, key: string): Promise<Result<null>>;
    removeKey(provider: AiProvider): Promise<Result<null>>;
    testGoogle(): Promise<Result<null>>;
    setModels(models: AiStatus["models"]): Promise<Result<null>>;
    restoreModels(): Promise<Result<AiStatus["models"]>>;
    wordText(word: string, languageName: string): Promise<Result<WordText>>;
    /** WAV bytes. */
    wordAudio(word: string): Promise<Result<Uint8Array>>;
    /** JPEG bytes. */
    wordImage(word: string, sentence: string): Promise<Result<Uint8Array>>;
  };
  library: {
    /** Everything the learner has stored. */
    load(): Promise<Result<LibrarySnapshot>>;
    /** Persist one change atomically. */
    apply(change: LibraryChange): Promise<Result<null>>;
  };
}
