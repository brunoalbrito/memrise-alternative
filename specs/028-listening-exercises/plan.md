# Implementation Plan: Listening Exercises

**Branch**: `feat/exercise-types` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Three more exercise kinds: `audio-to-word` (hear it, pick the word), `word-to-audio` (see the word, pick the recording; each option has a
play button) and `audio-to-type` (hear it, type it: the typing screen with a replay button where the picture is). A shared audio player
plays one recording at a time through the app's media protocol, starts a recording automatically when an exercise appears and offers
replay (button and `R`). The prompt never contains the word's text for listening exercises.

## Decisions
- Eligibility: the word must have audio (`word-to-audio` also needs three other words with audio).
- Audio that fails to play shows a message and the exercise is replaced for that word by another possible type.
- Review words prefer `audio-to-type` and `type`; new words prefer the easier choices, listening choices among them.

## Constitution Check
Pass: same module, no new libraries.
