# Tasks: AI Assistant with Protected Keys
- [x] T001 Settings and Secrets services with an injectable Cipher (electron/services/settings.ts, secrets.ts)
- [x] T002 Port Gemini and Pollinations calls, parsing, WAV and prompts to main (electron/services/ai/*)
- [x] T003 safeStorage cipher and nativeImage shrinking (electron/main/secureStorage.ts)
- [x] T004 ai:* IPC with validation; preload API; AI error codes
- [x] T005 Renderer: client layer, status-only aiStore, hook and dialog updates, weak-protection notice; remove direct provider calls
- [x] T006 Unit tests (secrets, error mapping, key only in headers, prompts, parsing) and e2e (key encrypted on disk, never returned)
