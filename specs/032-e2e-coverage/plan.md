# Implementation Plan: End-to-End Coverage

**Branch**: `feat/speed-review-game` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

## Summary
Sample media is generated in `scripts/sample-media.ts` (solid-colour PNGs and short WAV tones, content-addressed by sha256) and wired into
`make-sample-library.ts`. The library holds a single sample course, "Sample Course: Pictures and Sounds", whose 12 words all have a picture and a recording. New e2e files:
`create-course.spec.ts` (form, validation, creation), `course-editor.spec.ts` (levels, words, media), `learning-modes.spec.ts` (all 8 exercise types on the sample library).
`speed-review.spec.ts` is extended with picture, recording, keyboard and reduced-motion rounds.

## Decisions
- Work is split by file so agents do not collide: samples, speed review, creation/editor tests.
- No binary assets in git; no new libraries (fflate already present).
- Tests import the sample library through the public import API.

## Constitution Check
Pass (v3.0.0): Vitest and Playwright only, no new libraries.
