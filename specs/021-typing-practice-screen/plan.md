# Implementation Plan: Typing Practice Screen

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

UI and behavior: [practice-screen-ui-contract](../../docs/local-first/contracts/practice-screen-ui-contract.md).

## Summary
New feature module `src/features/practice`: a full-window screen at `/course/:id/learn`, `/review` and `/speed-review` (the
session picker already links there). Pure, unit-tested model (`text`, `tiles`, `word`, `points`, `queue`), a session hook, and
small M3 components. Every finished word is sent to the main process (`study:start`, `study:answer`, `study:end`), which keeps
a `sessions` row and a `review_log` row per answer (migration 0004). Scheduling is spec 022 and builds on that log.

## Decisions
- Letters are always tiles of the tray: keyboard letters pick the first free matching tile, so the answer is graded as a spelling
  of the word's letters; spaces and punctuation are filled in automatically and never need typing.
- `H` asks for a hint only while the input is not focused; `Alt+H` works everywhere (otherwise words with an "h" could not be
  typed). Number keys 1 to 8 pick tiles and are disabled for words that contain digits.
- Result of a word: `correct`, `hinted` (correct after hints), `wrong` (correct after at least one mistake, one lapse),
  `gave_up`, `timeout`. Points: 10, minus 3 per hint (minimum 1); 0 for gave_up/timeout.
- Until 022, a session is the first ten usable words in level order (a word needs text and an image, meaning or example).
- Per-course accent tolerance is supported by the model but there is no setting to turn it on yet (exact accents are required).
- The shortcuts toggle is remembered in the browser storage of the window (a per-user convenience, not library data).
- Added M3 tokens (error, tertiary and inverse container roles) and keyboard/backspace/help icons; `useMediaUrl` moved to `shared/media`.

## Constitution Check
Pass (v3.0.0): feature-scoped module, M3 tokens, no new libraries.
