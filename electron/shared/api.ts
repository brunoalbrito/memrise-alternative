import type { LibraryChange, LibrarySnapshot } from "./schemas";

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
  library: {
    /** Everything the learner has stored. */
    load(): Promise<Result<LibrarySnapshot>>;
    /** Persist one change atomically. */
    apply(change: LibraryChange): Promise<Result<null>>;
  };
}
