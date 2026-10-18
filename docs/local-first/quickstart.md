# Quickstart: Validation Guide

Prerequisites: Node.js >= 22.22, pnpm, a computer with a graphical session. Contracts: [ipc](./contracts/ipc-contract.md),
[file format](./contracts/membetter-file-format.md), [practice UI](./contracts/practice-screen-ui-contract.md).

## Setup
```sh
pnpm install
pnpm dev:electron        # runs the Electron app with hot reload (script added in phase 0)
pnpm typecheck && pnpm lint && pnpm test
pnpm build:electron      # unpacked build for the current OS
pnpm test:e2e            # Playwright for Electron (uses a temporary data folder)
```

## Scenario 1: Local persistence (US1, SC-002)
1. Start the app with a clean data folder. Create a course, two levels, five words with images and audio.
2. Disable the network, quit, reopen. Expect everything present; the saved status shows "Saved".
3. Kill the process during an edit; reopen. Expect at most the last keystroke lost.

## Scenario 2: Export and import (US2, SC-003 to SC-005)
1. Export the course; choose a location. Expect one `.membetter` file and a progress indicator.
2. Start with an empty data folder, drop the file on the window. Expect an identical course.
3. Import it again. Expect the Replace / Import as copy / Cancel dialog; test each.
4. Import the files in `tests/fixtures/hostile/` (zip-slip, bomb, bad hash, newer version, truncated). Expect a clear message for each and no library change.

## Scenario 3: Typing practice (US3, SC-006)
1. Open a course with images, start Learn. Expect the screen from the contract.
2. Type the word with the keyboard only, then use number keys for tiles, backspace, Alt+H hint, Cmd/Ctrl+Enter give up.
3. Toggle shortcuts; labels hide and show. Close mid-session, confirm; reopen Home and see the answered words counted.
4. Resize below 720 px; layout stacks. Use a screen reader or axe to check labels and live feedback.

## Scenario 4: Scheduling (US4, SC-010)
1. Learn five words, finish. Expect Classic review to say nothing is due and show the next due time.
2. Use the test hook to advance the clock one day; expect the words due. Answer one wrong; expect it due sooner than the correct ones.

## Scenario 5: Backup and restore (US5, SC-008)
1. Set a backup folder; run a backup now. Delete a course. Restore the backup. Expect the course back.
2. Make the folder read-only; start the app after the interval. Expect a non-blocking warning.

## Scenario 6: Secrets (SC-009)
1. Save an AI key. Expect only "connected, ending in ...". Export the course and the library; search the files for the key. Expect none.
2. Search the app logs and the database file for the key text. Expect none (only ciphertext).

## Scenario 7: Prototype import (FR-007)
1. In the web build click "Export my data" and save. In the desktop app choose "Import from browser version".
2. Expect courses, words and media. Repeat; expect no duplicates.

## Scenario 8: Anki (US6, phase 7)
1. Export for Anki; open in Anki. Expect one deck, one card per word, media playing. Import a CSV with a bad row; expect it reported.

## Packaging check (phase 8)
Install the built installer on each OS, create data, install an update build, and confirm the data survives and the version changes.
