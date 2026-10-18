# Contract: IPC API exposed as `window.api`

Defined in `electron/ipc/channels.ts` as zod schemas; the renderer client in `src/shared/api` derives its types from the
same schemas. Every call returns `Promise<Result<T>>` where
`Result<T> = { ok: true, data: T } | { ok: false, error: { code: ErrorCode, message: string, fields?: Record<string,string> } }`.
Error codes: `validation_failed`, `not_found`, `conflict`, `limit_exceeded`, `unsupported_format`, `integrity_failed`,
`io_error`, `secret_unavailable`, `provider_error`, `busy`, `internal`.

The preload exposes only these groups. Nothing else (no `ipcRenderer`, no `fs`, no `shell`) is reachable from the renderer.

| Group | Methods | Notes |
|-------|---------|-------|
| `courses` | `list(filter)`, `get(id)`, `create(input)`, `update(id, patch)`, `remove(id)`, `restore(id)`, `setSettings(id, patch)` | `list` returns cards with progress and goal; filters: all, goal, teaching, category |
| `levels` | `list(courseId)`, `add`, `rename`, `setTested`, `duplicate`, `remove` | Duplicate re-references media, never copies files |
| `words` | `add(levelId, input)`, `update(id, patch)`, `remove(id)`, `move(id, levelId, position)` | Debounced from the editor |
| `media` | `pickAndAdd(wordId, kind)`, `addFromBytes(wordId, kind, bytes, name)`, `detach(wordId, hash)`, `url(hash)` | `pickAndAdd` opens the native dialog in main; `url` returns `membetter-media://<hash>` |
| `study` | `startSession(courseId, kind)`, `next(sessionId)`, `answer(sessionId, wordId, outcome)`, `endSession(sessionId)`, `summary(sessionId)`, `dueInfo(courseId)`, `markWord(wordId, flag, value)` | `outcome` = `{result, hintsUsed, attempts, elapsedMs}`; main computes rating, points and next due |
| `stats` | `course(courseId)`, `overview()` | Streak, reviews per day, recall rate |
| `exchange` | `exportCourse(courseId, {includeProgress})`, `exportLibrary()`, `inspectFile(path)`, `importFile(path, choice)`, `importPrototypeFile(path)`, `onProgress(cb)` | `inspectFile` returns a preview and any conflict; the dialog then calls `importFile` with `replace`, `copy` or `cancel` |
| `backup` | `getConfig()`, `setConfig(patch)`, `runNow()`, `list()`, `restore(id)` | `restore` restarts the app |
| `ai` | `status()`, `saveKey(provider, key)`, `removeKey(provider)`, `testKey(provider)`, `getSettings()`, `setSettings(patch)`, `suggestWord({word, sentenceCount})`, `sceneImage({word, sentence})` | Keys are write-only: `status` returns `{provider, connected, last4}` |
| `anki` | `exportDeck(courseId)`, `importCsv(path, mapping)` | Phase 7 |
| `app` | `info()`, `onOpenFile(cb)`, `checkForUpdates()`, `openDataFolder()` | `onOpenFile` fires when a `.membetter` file is opened with the app or dropped on the window |

Rules:
1. Every payload is parsed in main; unknown keys are rejected.
2. Handlers never throw to the renderer; errors are mapped to `Result` errors with no stack traces or file paths.
3. Long operations (export, import, backup) emit `exchange:progress` events `{operationId, phase, done, total}` and are
   cancellable with `exchange.cancel(operationId)`.
4. Secrets never appear in any channel result or event.
5. Paths received from the renderer are never used: file locations come from native dialogs opened in main, or from the OS
   "open file" event.
6. Channel names are versioned by the app version; the renderer and main always ship together, so no compatibility shim is needed.
