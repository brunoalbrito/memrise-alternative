# Implementation Plan: Anki Interoperability

**Branch**: `feat/local-first-desktop` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
`electron/services/anki.ts`: export writes an Anki package (`.apkg`: a zip with `collection.anki2`, a `media` index and media
files numbered from 0). The collection uses the long-supported schema version 11 (tables col, notes, cards, revlog, graves),
one note type "MemBetter word" (Word, Meaning, Example, IPA, Image, Audio) whose card shows the picture and meaning and asks to
type the word, one deck per course with the levels as sub-decks (`Course::Level`). CSV import parses RFC 4180 text
(comma, semicolon or tab, detected), lets the learner map columns, and creates a new course (levels of 100 words), reporting every
skipped row (empty word, repeat, too long) with its row number.

## Decisions
- Study progress is not exported to Anki (different scheduler); only content.
- Missing media is left out and the words are still exported.
- Fields are HTML-escaped; images are `<img src>` and audio `[sound:…]` using stable names `membetter-<hash12>.<ext>`.
- Not verified against a real Anki installation in this environment: the tests read the package back and check the schema, JSON
  structures, checksums, deck and card layout. A manual import in Anki is listed in the quickstart.
- The CSV file must be UTF-8 (a BOM is accepted); limit 20 MB and 50,000 rows.

## Constitution Check
Pass (v3.0.0): fflate and zod are listed; no new libraries.
