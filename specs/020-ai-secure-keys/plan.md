# Implementation Plan: AI Assistant with Protected Keys

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
The Google AI Studio and Pollinations calls move from the renderer to the main process (`electron/services/ai`). Keys are saved
once through `ai.saveKey`, encrypted with Electron `safeStorage` (OS Keychain / DPAPI / libsecret) into the `settings` table as
ciphertext plus the last four characters, and decrypted only inside `AiService` for one request, sent only in headers. The
renderer's `aiStore` keeps just connection status, last four characters and model names.

## Decisions
- Errors cross IPC as `ai:<kind>` codes mapped back to the existing user messages; messages never include keys or bodies.
- Generated audio (WAV) and pictures (JPEG, shrunk with Electron's built-in `nativeImage`, no new library) return as bytes and
  are stored through the media service by the existing editor code.
- `describeScene` plus the "no text in picture" prompt and the fallback scene now run in main (`AiService.wordImage`).
- On Linux without a keyring, `safeStorage` falls back to weak storage: the dialog warns. Without any secure storage, saving is refused.
- Keys from the browser prototype are not migrated; the learner enters them again. Exports never include settings.
- Backup (spec 023) must exclude the `ai.*Key.enc` and `ai.*Key.last4` settings rows.
- The renderer has no network access (CSP `connect-src 'self'`).

## Constitution Check
Pass (v3.0.0): no new libraries.
