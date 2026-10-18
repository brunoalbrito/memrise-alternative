# Roadmap: local-first desktop migration

This folder keeps the full requirements, `research.md`, `data-model.md`, `contracts/` and the combined plan as shared design. **Implement the child specs below, one at a time, in order.** Each child gets its own `/speckit-plan`, `/speckit-tasks`, `/speckit-implement` run, so each fits in a small budget and leaves the app working.

| Order | Spec | Delivers | Depends on |
|-------|------|----------|-----------|
| 016 | [016-electron-foundation](../../specs/016-electron-foundation/spec.md) | Run the existing app inside a secure desktop shell with an empty local database and automated checks. | none |
| 017 | [017-local-data-layer](../../specs/017-local-data-layer/spec.md) | Courses, levels, words, goals and settings are stored locally and every existing screen reads and writes them there. | 016 |
| 018 | [018-local-media-storage](../../specs/018-local-media-storage/spec.md) | Images and audio are stored as files on the computer, shown in the editor, validated and cleaned up automatically. | 017 |
| 019 | [019-course-export-import](../../specs/019-course-export-import/spec.md) | Export a whole course (or the whole library) to one file and import it elsewhere safely, including data from the browser prototype. | 018 |
| 020 | [020-ai-secure-keys](../../specs/020-ai-secure-keys/spec.md) | The AI Word Assistant keeps working, with keys held in the operating system's protected storage and never shown again. | 018 |
| 021 | [021-typing-practice-screen](../../specs/021-typing-practice-screen/spec.md) | When practicing, the learner sees the word's image and types the word using the keyboard, letter tiles, hints or give-up. | 018 |
| 022 | [022-spaced-repetition-sessions](../../specs/022-spaced-repetition-sessions/spec.md) | Learn, Classic review and Speed review use a real schedule, with real progress counts and personal statistics. | 021 |
| 023 | [023-library-backup-restore](../../specs/023-library-backup-restore/spec.md) | Automatic and manual backups of the whole library with a simple restore. | 018, 020 |
| 024 | [024-anki-interop](../../specs/024-anki-interop/spec.md) | Export a course for Anki and import simple word lists from CSV. | 018 |
| 025 | [025-desktop-release](../../specs/025-desktop-release/spec.md) | Installers, signing, automatic updates and the privacy text for the public release. | all |

Parallel options after 018: 019, 020 and 021 are independent. Minimum useful app: 016, 017, 018, 021, 022. Sharing: add 019. Safety net: 023. Optional: 024.

Per child spec, run in order: `/speckit-plan` (reads these design files), `/speckit-tasks`, `/speckit-implement`. Set `.specify/feature.json` to the spec directory before each run.
