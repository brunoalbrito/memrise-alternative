# Implementation Plan: Multiple Choice Exercises

**Branch**: `feat/exercise-types` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Introduce an exercise abstraction in `features/practice`: each planned word gets an `Exercise` (kind, options, correct index) chosen when the
session starts. Typing stays one kind; this slice adds four choice kinds: `word-to-image`, `image-to-word`, `word-to-meaning`,
`meaning-to-word`. Distractors come from all words of the course (same level first), never duplicate a text, meaning or picture, and a
kind is only eligible when three distractors exist. A selector picks the kind from the word's stage (study card state), the session kind and
what the word has. The session hook, answer log (new `exercise` column), points (half for choices) and keyboard (1 to 4) are extended.

## Decisions
- Exercises are chosen once per word at the start of the session, so they are stable while a word is on screen and settings apply to the next session.
- Choice answers: first-try correct = Good; any mistake first = one lapse (`wrong`); give up = Again; no hints. Points are half of a typed answer.
- Stage from the card: new or learning (state 0, 1, 3) prefers choices; review (state 2) prefers typing with some choices for variety; speed review uses choices.
- `study.plan` also returns each planned word's card state.
- Words with only audio (no picture, meaning or example) can now be practiced (used by 028).

## Constitution Check
Pass (v3.0.0): feature-scoped (`features/practice`), M3 tokens, no new libraries.
