import type { ExerciseKind } from "./exercises";
import type {
  ExportItem,
  ExportOutcome,
  ImportChoice,
  ImportOutcome,
  ImportPreview,
  LibraryChange,
  LibrarySnapshot,
} from "./schemas";

export type AiProvider = "google" | "nanoBanana";

export interface AiStatus {
  google: { connected: boolean; last4: string };
  nanoBanana: { connected: boolean; last4: string };
  models: { textModel: string; speechModel: string; nanoBananaModel: string };
  /** The operating system only offers weak protection for saved keys. */
  weakProtection: boolean;
}

export interface WordText {
  definition: string;
  sentences: string[];
  best: number;
  ipa: string;
}

export type SessionKind = "learn" | "classic" | "speed";
export type AnswerResult = "correct" | "hinted" | "wrong" | "gave_up" | "timeout";

export interface AnswerOutcome {
  wordId: string;
  /** Which kind of exercise produced the answer (default: typing). */
  exercise?: ExerciseKind;
  result: AnswerResult;
  hintsUsed: number;
  attempts: number;
  elapsedMs: number;
  points: number;
}

export interface SessionSummary {
  sessionId: string;
  answered: number;
  correct: number;
  hints: number;
  points: number;
}

export type PracticeKind = SessionKind;

export interface StudyPlan {
  wordIds: string[];
  /** Card state of each planned word: 0 new, 1 learning, 2 review, 3 relearning. */
  states: Record<string, number>;
  dueCount: number;
  newLeft: number;
  nextDueAt: string | null;
}

export interface CardProgress {
  learned: boolean;
  /** Mistakes made after the word was learned. */
  lapses: number;
  /** Empty for a word that has not been answered yet. */
  dueAt: string;
  ignored: boolean;
  longTerm: boolean;
}

export interface StudyProgress {
  cards: Record<string, CardProgress>;
  practicedToday: Record<string, number>;
  newPerDay: Record<string, number>;
}

export interface CourseStats {
  streakDays: number;
  last14: { day: string; reviews: number }[];
  recallPercent: number | null;
  totalReviews: number;
  learned: number;
  ignored: number;
  longTerm: number;
}

export interface BackupConfigData {
  enabled: boolean;
  folder: string;
  intervalDays: number;
  keep: number;
  lastAt: string | null;
  lastError: string | null;
}
export interface BackupEntryData {
  id: string;
  createdAt: string;
  sizeBytes: number;
}

export interface CsvPreviewData {
  delimiter: string;
  columns: number;
  totalRows: number;
  sample: string[][];
  looksLikeHeader: boolean;
}
export interface CsvImportInput {
  path: string;
  hasHeader: boolean;
  mapping: { word: number; meaning: number | null; example: number | null; ipa: number | null };
  title: string;
  teachingLanguageId: string;
  speakersLanguageId: string;
}
export interface CsvImportResult {
  courseId: string;
  imported: number;
  skipped: { row: number; reason: string }[];
}

/** Result envelope returned by every `window.api` call. */
export type ApiError = { code: string; message: string };
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export interface AppInfo {
  name: string;
  version: string;
  platform: string;
  libraryVersion: number;
  /** Folder that holds the library (database and media). */
  dataPath: string;
}

/** Surface exposed to the renderer by the preload script. Grows with each feature. */
export interface MembetterApi {
  app: {
    info(): Promise<Result<AppInfo>>;
    /** Show the library folder in the file manager. */
    openDataFolder(): Promise<Result<null>>;
  };
  media: {
    /** Validate and store a file under `id`. Fails with a clear message when the type or size is not allowed. */
    put(id: string, bytes: Uint8Array, name: string): Promise<Result<null>>;
    remove(id: string): Promise<Result<null>>;
  };
  exchange: {
    /** Ask where to save, then write a .membetter file with these courses (one course, or a whole library). */
    exportItems(items: ExportItem[], includeProgress?: boolean): Promise<Result<ExportOutcome>>;
    /** Show the native open dialog. Returns the chosen path, or null. */
    pickFile(): Promise<Result<string | null>>;
    /** Read and validate a file without changing the library. */
    inspect(path: string): Promise<Result<ImportPreview>>;
    /** Apply a previously inspected file. */
    commit(token: string, choice: ImportChoice, includeProgress?: boolean): Promise<Result<ImportOutcome>>;
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
  study: {
    startSession(courseId: string, kind: SessionKind, wordCount: number): Promise<Result<string>>;
    /** Records one answer and returns the running totals. */
    answer(sessionId: string, outcome: AnswerOutcome): Promise<Result<SessionSummary>>;
    endSession(sessionId: string, status: "completed" | "abandoned"): Promise<Result<SessionSummary>>;
    /** Which of these words (in this order) a session of this kind should contain. */
    plan(courseId: string, kind: SessionKind, wordIds: string[]): Promise<Result<StudyPlan>>;
    /** Learned, due, ignored and long-term state of every word that has been practiced. */
    progress(): Promise<Result<StudyProgress>>;
    stats(courseId: string): Promise<Result<CourseStats>>;
    mark(courseId: string, wordId: string, flag: "ignored" | "longTerm", value: boolean): Promise<Result<null>>;
    /** Sets the flag for many words at once. */
    markMany(courseId: string, wordIds: string[], flag: "ignored" | "longTerm", value: boolean): Promise<Result<null>>;
    setNewPerDay(courseId: string, value: number): Promise<Result<null>>;
    /** Best speed review score of a course (null before the first game). */
    speedBest(courseId: string): Promise<Result<number | null>>;
    /** Saves a finished game's score if it is the best so far. */
    saveSpeedScore(courseId: string, score: number): Promise<Result<{ best: number | null; improved: boolean }>>;
    /** Exercise types that are turned on. */
    exerciseSettings(): Promise<Result<ExerciseKind[]>>;
    setExerciseSettings(enabled: ExerciseKind[]): Promise<Result<null>>;
  };
  anki: {
    /** Ask where to save, then write an Anki package (.apkg) for this course. */
    exportDeck(item: ExportItem): Promise<Result<{ saved: boolean; notes: number }>>;
    pickCsv(): Promise<Result<string | null>>;
    previewCsv(path: string): Promise<Result<CsvPreviewData>>;
    importCsv(input: CsvImportInput): Promise<Result<CsvImportResult>>;
  };
  backup: {
    getConfig(): Promise<Result<BackupConfigData>>;
    setConfig(patch: Partial<Pick<BackupConfigData, "enabled" | "folder" | "intervalDays" | "keep">>): Promise<Result<BackupConfigData>>;
    /** Native folder picker. Returns the chosen folder, or null. */
    chooseFolder(): Promise<Result<string | null>>;
    runNow(): Promise<Result<BackupEntryData>>;
    list(): Promise<Result<BackupEntryData[]>>;
    /** Replaces the library with this backup and restarts the app. The current library is kept in a safety copy. */
    restore(id: string): Promise<Result<null>>;
  };
  library: {
    /** Everything the learner has stored. */
    load(): Promise<Result<LibrarySnapshot>>;
    /** Persist one change atomically. */
    apply(change: LibraryChange): Promise<Result<null>>;
  };
}
