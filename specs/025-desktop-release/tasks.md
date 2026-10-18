# Tasks: Desktop Release
- [x] T001 electron-builder configuration (targets, native module unpacking, publish to GitHub, file association)
- [x] T002 Auto-update with electron-updater (packaged builds only) and restart prompt
- [x] T003 Release workflow on version tags (three operating systems, optional signing secrets)
- [x] T004 Privacy page and link from Home; app info (version, library folder) and "show the folder"
- [x] T005 Packaged macOS smoke test; performance test with 50 courses and 20,000 words
- [x] T006 README for the desktop app
- [ ] T007 Signing and notarization credentials, application icon (owner)
- [ ] T008 Build and test the Windows and Linux installers and a real update from a published release (owner / CI)
- [ ] T009 Turn off unused Electron fuses (runAsNode, NODE_OPTIONS, onlyLoadAppFromAsar, ASAR integrity) in an afterPack step together with signing; tried via `electronFuses`, but on an unsigned macOS arm64 build it stops the app from starting
