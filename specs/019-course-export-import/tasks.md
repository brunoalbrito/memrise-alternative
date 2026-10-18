# Tasks: Course Export and Import
- [x] T001 fflate dependency; export/import schemas and preview types (electron/shared/schemas.ts)
- [x] T002 Archive writer (streaming zip, atomic rename, progress) and reader/validator (electron/services/exchange.ts)
- [x] T003 Import with replace/copy, deterministic ids, single transaction, media GC
- [x] T004 IPC: export, pickFile, inspect, commit, open-file; preload pathForFile and events
- [x] T005 Library feature: exchange store, ImportDialog, LibraryHost (drop, open-with, progress, notices), toolbar
- [x] T006 Export course menu item and Export all via HomeExtensions context
- [x] T007 Browser build "Export my data" (prototype export) and file association in electron-builder.yml
- [x] T008 Unit tests: round trip, conflicts, hostile files (zip-slip, bomb, bad hash, newer version, truncated), rollback, prototype file
- [x] T009 E2E: export then import across two libraries, damaged file rejected
