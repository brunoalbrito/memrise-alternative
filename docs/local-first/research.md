# Research: Local-First Desktop App with Typing Practice

All items are decided. No `NEEDS CLARIFICATION` remains.

## R1. Desktop shell and build tool
- **Decision**: Electron with `electron-vite` (Vite for main, preload and renderer), packaged with `electron-builder`.
- **Rationale**: Keeps Vite as the single bundler (constitution principle I); one config for three targets; the existing renderer moves in unchanged.
- **Alternatives**: Tauri (smaller binary, but needs Rust and a different IPC model; user asked for Electron); Electron Forge (also fine, but electron-vite reuses existing Vite setup).

## R2. Local database
- **Decision**: SQLite through `better-sqlite3` in the main process, WAL mode, foreign keys on, forward-only numbered SQL migrations tracked with `PRAGMA user_version`, a copy of the database taken before each upgrade.
- **Rationale**: Same storage model as Anki; synchronous API is simple and fast in the main process; one file is easy to back up.
- **Alternatives**: Built-in `node:sqlite` (no native module, but still experimental in the Electron Node version at the time of writing: revisit at phase 0 and switch if stable); IndexedDB (stays in the renderer, no file portability); a JSON file (no integrity or querying).
- **Risk**: native module must be rebuilt for Electron's ABI. Mitigation: `electron-builder install-app-deps` in CI for each OS, prebuilt binaries, a smoke test that opens the DB in the packaged app.

## R3. IPC and validation
- **Decision**: Typed channels, `ipcMain.handle` only (request/response), each payload parsed with `zod` in main; results are `{ok:true,data}` or `{ok:false,error:{code,message}}`. Preload exposes one object `window.api` grouped by area; never exposes `ipcRenderer` itself.
- **Rationale**: Renderer is untrusted; schemas double as TypeScript types shared with the renderer client.
- **Alternatives**: `electron-trpc` (extra dependency, no need); raw `ipcRenderer` exposure (insecure).

## R4. Media storage
- **Decision**: Files stored as `media/<sha256>.<ext>`; table `media` keyed by hash; `word_media` and course cover reference by hash; reference-counted cleanup at startup and after deletes. Served to the renderer through a registered `membetter-media://<hash>` protocol that looks up the hash in the database (no filesystem paths from the renderer). Images re-encoded to strip metadata and capped at 768 px for AI pictures; magic-byte check; no SVG.
- **Rationale**: Deduplication, trivial export (copy by hash), no path traversal surface.
- **Alternatives**: `file://` URLs (needs relaxed web security); blobs in SQLite (bloat, slow backups).

## R5. Export and import format
- **Decision**: `.membetter` = ZIP (`fflate`) with `manifest.json`, `course.json`, `media/<hash>.<ext>`, optional `progress.json`. Specified in [contracts/membetter-file-format.md](./contracts/membetter-file-format.md). Library export uses the same container with a `courses/<id>/` folder per course.
- **Rationale**: Inspectable with any zip tool, streamable, versioned, content hashes verify integrity.
- **Safety**: reject entry names with `..`, absolute paths or unexpected folders; cap entry count, per-entry size and total uncompressed size (zip-bomb guard); verify each media SHA-256; parse JSON with zod; write inside one SQLite transaction and copy media to a temp folder first, moving files in after commit.
- **Alternatives**: single JSON with base64 media (huge, memory heavy); folder export (not "one file").

## R6. Spaced repetition
- **Decision**: `ts-fsrs` with default parameters and desired retention 0.9, ratings mapped from the practice outcomes: Again (gave up or wrong), Hard (correct with hints), Good (correct, no hints), Easy (correct, fast, no hints, only in speed review). Learn session introduces up to `new_per_day` (default 10).
- **Rationale**: FSRS is the current Anki default scheduler; the library is small and maintained; keeps the full review log needed for later optimization.
- **Alternatives**: SM-2 (simpler, less accurate); own algorithm (more code, no benefit).
- **Day boundary**: "today" rolls over at 04:00 local time (like Anki) to avoid midnight surprises; clamped when the system clock moves backward.

## R7. Typing practice behavior
- **Matching**: Normalize with Unicode NFC, trim, collapse spaces, case-insensitive; if the course has accent tolerance, compare after NFD and removing combining marks. Spaces and punctuation in the word are auto-filled and not offered as tiles.
- **Tiles**: One tile per letter of the answer (multiset), shuffled with a seeded shuffle per word (stable within the attempt, reshuffled on the next word). First eight tiles get number keys 1 to 8; more tiles are click-only. Duplicate letters are separate tiles. Used tiles show a pressed/disabled state and return on backspace.
- **Keys**: letters typed in the focused input are entered normally; digits 1 to 8 pick tiles even while the input is focused (disabled for a word that itself contains digits); `H` triggers Hint when focus is not in the input, and `Alt+H` triggers it from anywhere (so words containing the letter h can still be typed); `Cmd/Ctrl+Enter` is "I don't know"; `Enter` submits; `Esc` opens the exit dialog. This refines FR-022 (H key): plain `H` cannot be a global shortcut while the input is focused. Details in [contracts/practice-screen-ui-contract.md](./contracts/practice-screen-ui-contract.md).
- **Hint rule**: reveals the next correct letter after the correctly typed prefix; each hint lowers the word's points (full 10, minus 3 per hint, minimum 1, 0 when given up) and the review rating becomes Hard.
- **Auto-advance**: when typed length equals the answer length and it matches, success is shown for 800 ms then the next word loads; a mismatch at full length shows an error and waits.
- **Rationale**: Mirrors the reference screenshot while remaining keyboard-friendly and testable as pure functions.

## R8. AI keys and calls
- **Decision**: Keys saved with `safeStorage.encryptString` into a settings row (ciphertext only); decrypted in `services/ai.ts` for one call; renderer can only ask "connected?" and "save/remove/test". On Linux without a keyring `safeStorage` may fall back to weak storage: detect `getSelectedStorageBackend()` and warn the user.
- **Rationale**: Matches the earlier server design but with the OS as the key vault; no keys in the renderer, so XSS cannot read them.
- **Alternatives**: Storing in plain settings (rejected, SC-009); a custom master password (extra friction).

## R9. Prototype data import
- **Decision**: Add an "Export my data" button to the existing web build that writes a `library.membetter`-compatible file from `localStorage` (`membetter.learner`) and IndexedDB (`membetter-media`). The desktop app imports it with the normal library import. Re-import matches by course id, so it never duplicates.
- **Rationale**: A desktop app cannot read a browser's storage, and this reuses the import code path.
- **Alternatives**: Reading browser profile folders (fragile, privacy-invasive).

## R10. Backups
- **Decision**: SQLite online backup API (`db.backup()`) to `<folder>/membetter-YYYYMMDD-HHMMSS.db`, plus copy of media files missing from the backup folder's `media/` (content-addressed, so incremental). Retention default 10. Restore: close the DB, validate the backup (integrity check, user_version not newer), swap in, restart.
- **Alternatives**: Copying the live file (can be inconsistent); exporting full `.membetter` each time (slow for big libraries).

## R11. Single instance and data location
- **Decision**: `app.requestSingleInstanceLock()` plus a lock file in the data folder; default location is Electron's `userData`; user-selectable location deferred (open decision in LOCAL_FIRST_PLAN.md), the path is read from one setting so it can be added later.
- **Rationale**: Prevents two processes writing the same WAL database.

## R12. Testing
- **Decision**: Vitest for pure logic and services against in-memory SQLite (`:memory:`) and temp folders; Playwright with Electron (`_electron.launch`) for end-to-end flows using a temp user-data dir; fixtures for malicious zips. CI runs unit and integration on Linux, builds on three OSes, runs e2e on Linux and macOS.
- **Rationale**: Data integrity features need automated regression tests.

## R13. Packaging and updates
- **Decision**: `electron-builder` targets: NSIS (Windows), dmg and zip (macOS), AppImage and deb (Linux); `electron-updater` using GitHub Releases. Signing certificates are bought before the public release (phase 8); unsigned builds are used for testers.
- **Alternatives**: Manual updates (no); a custom update server (cost, no need).

## R14. Security posture of the window
- **Decision**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`, CSP `default-src 'self'; img-src 'self' membetter-media: data:; media-src 'self' membetter-media:; connect-src 'none'` (the renderer makes no network calls; AI goes through main), `setWindowOpenHandler` denies, `will-navigate` blocked, Electron fuses set (disable `RunAsNode`, `NODE_OPTIONS`, enable ASAR integrity where supported).
