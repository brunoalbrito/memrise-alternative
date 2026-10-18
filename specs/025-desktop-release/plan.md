# Implementation Plan: Desktop Release

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Packaging with `electron-builder` (macOS dmg/zip, Windows NSIS, Linux AppImage/deb; native SQLite module unpacked from the asar),
auto-update through `electron-updater` against GitHub Releases (installed builds only: download in the background, ask to restart),
a tag-driven release workflow, a privacy page (`/privacy`, linked from Home) that says what is stored and what AI features send, and
a performance check against the library-size target.

## Done and verified here
- macOS arm64 unpacked app built with `electron-builder --dir`; a Playwright smoke test (`pnpm test:packaged`) launches it, creates the
  library with the native module, and checks data survives a restart.
- Home with 50 courses and 20,000 words is ready in well under a second (test asserts < 3 s).

## Not done here (needs the owner)
- Code signing and notarization: Apple Developer ID certificate and notarization credentials, Windows code-signing certificate.
  Add them as the repository secrets named in `.github/workflows/release.yml`. Until then installers are unsigned and macOS and Windows
  show security warnings (the spec's "without warnings once signed" cannot be met yet).
- Windows and Linux installers and the update flow were not built or run in this environment (macOS only); the release workflow builds
  them on their own runners. The auto-update path was not exercised against a real release.
- An application icon (the default Electron icon is used).

## Constitution Check
Pass (v3.0.0): electron-builder and electron-updater are listed; no other new libraries.
