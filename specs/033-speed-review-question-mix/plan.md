# Implementation Plan: Speed Review Question Mix

**Branch**: `feat/speed-review-media-questions` | **Spec**: [spec.md](./spec.md)

## Summary
`model/speedGame.ts` gets `SPEED_ORDER` and `rotateKinds(enabled, index)`; `useSpeedGame` builds each question by trying the kinds in
turn (starting at the question number) with `chooseExercise` limited to one kind, and uses the first kind that fits the word.
`isListening` gives 8 seconds to both recording kinds. Tests: unit (rotation, time) and e2e (two rounds on the sample course).

## Constitution Check
Pass (v3.0.0): feature-scoped, no new libraries.
