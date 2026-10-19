# Feature Specification: End-to-End Coverage of Every Way to Learn

**Feature Branch**: `feat/speed-review-game`

**Created**: 2026-10-18

**Status**: Draft

**Input**: One sample course that carries pictures and recordings so every way to learn can be tried; end-to-end tests for creating a course, adding words (text, picture, recording) and learning with each exercise type; every new feature must have unit tests and an end-to-end scenario.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Samples that exercise every way to learn (Priority: P1)

The sample library has words with pictures and recordings, so picture, listening and typing exercises can all be tried and tested.

**Independent Test**: Import the sample library; open it in practice and speed review.

**Acceptance Scenarios**:

1. **Given** the sample library, **When** imported, **Then** it holds one course (not many) with 12 words in two levels, each with a picture and a recording, enough for every exercise type: typing, picking the picture for a word, picking the word for a picture, and hearing a word to pick or type it.
2. **Given** the sample media, **Then** it is generated from code (no binary files in the repository) and passes the app's own type and size checks.
3. **Given** the library is imported twice, **Then** nothing is duplicated.

### User Story 2 - Create a course and add words (Priority: P1)

Tests cover the whole path from an empty library to a course with words.

**Acceptance Scenarios**:

1. **Given** the create-course form, **Then** invalid input is explained and a valid course is created and shown on Home.
2. **Given** a created course, **When** levels and words are added (text, meaning, picture, recording), **Then** they are saved and survive a restart.
3. **Given** a word with a picture and a recording, **Then** it can be practiced with picture, listening and typing exercises.

### User Story 3 - Every exercise type, end to end (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the sample courses, **Then** each exercise type (type, word-to-image, image-to-word, word-to-meaning, meaning-to-word, audio-to-word, word-to-audio, audio-to-type) is played in a test.
2. **Given** speed review, **Then** it is played with text, picture and recording questions, with keyboard only, and with reduced motion.

## Requirements *(mandatory)*

- **FR-001**: Tests use only the public app API and screens, with an isolated data folder.
- **FR-002**: Every new feature has unit tests and at least one end-to-end scenario.
- **FR-003**: Tests do not depend on sound output or on real time beyond the game clock.

## Success Criteria

- **SC-001**: `pnpm test` and `pnpm test:e2e` pass.
- **SC-002**: All 8 exercise types appear in at least one passing end-to-end test.

## Assumptions

- Builds on 021, 026 to 031. Out of scope: new app features.
