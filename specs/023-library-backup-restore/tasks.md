# Tasks: Library Backup and Restore
- [x] T001 Backups service: config, create (online backup, keys removed, incremental media), list, retention, schedule (electron/services/backup.ts)
- [x] T002 Restore: validate (integrity, version, media), stage, keep current keys, swap with safety copy
- [x] T003 IPC, preload, startup and hourly automatic backups, relaunch after restore
- [x] T004 Backups dialog (settings, back up now, list, confirm restore) and startup warning
- [x] T005 Unit tests (consistency, keys absent from raw bytes, incremental media, retention, schedule, restore, refusals) and e2e
