# Implementation Plan: Local Media Storage

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Images and audio become files in `<library>/media/<sha256>.<ext>`. A `media` table maps each word reference id to its file, so
identical content is stored once. The renderer sends bytes through `window.api.media.put`; the main process sniffs the real
type from magic bytes, enforces 2 MB (images) and 3 MB (audio), writes atomically, and serves files through the
`membetter-media://media/<id>` protocol (only ids found in the database resolve; no paths cross the boundary).

## Decisions
- Reference ids stay `media-<uuid>`; words keep their JSON refs, and removing the last reference to a file deletes it.
- Garbage collection at startup removes media not referenced by any word, plus stray and temp files.
- SVG and anything not recognized by content is rejected. Metadata stripping/re-encoding of images is not done (no image
  library added); the 2 MB cap and type checks bound the risk.
- The browser build keeps its IndexedDB store for development only.
- The 5-per-word limit is enforced by the schema in main (`images` and `audio` arrays at most 5) as well as by the UI.

## Constitution Check
Pass (v3.0.0): no new libraries.
