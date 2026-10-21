# Feature Specification: Speed Review Question Mix

**Feature Branch**: `feat/speed-review-media-questions`

**Created**: 2026-10-18

**Status**: Draft

**Input**: Speed review must not only ask for the right meaning. It also asks with pictures and with recordings, taking turns between them.

Builds on [030 speed review game](../030-speed-review-game/spec.md) and [032 e2e coverage](../032-e2e-coverage/spec.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Questions take turns between picture, sound and meaning (Priority: P1)

**Independent Test**: Play a round on the sample course with all choice types on.

**Acceptance Scenarios**:

1. **Given** words with pictures and recordings and all choice types on, **Then** the questions take turns in this order: pick the word for a picture, pick the word you hear, pick the word for a meaning, pick the picture for a word, pick the recording for a word, pick the meaning for a word, and start again.
2. **Given** a word that cannot be asked as the next kind (no picture, no recording or no meaning), **Then** the next kind that fits is used; the word is only left out when no choice kind fits (typing is never used).
3. **Given** the learner turned some types off, **Then** only the types that are on take turns.
4. **Given** a question that plays recordings (hear the word, or pick the recording), **Then** it allows 8 seconds.

### User Story 2 - Every kind can be played by keyboard (Priority: P2)

1. **Given** any kind of question, **Then** the options are chosen with keys 1 to 4, and recordings can be played without the mouse.

## Requirements

- **FR-001**: The order of kinds is the same in every round (no random choice), so rounds can be tested.
- **FR-002**: Answers are logged with the exercise type that was asked.

## Success Criteria

- **SC-001**: A round with all types on asks at least picture, recording and meaning questions in its first three questions.

## Assumptions

- Out of scope: new exercise types, sound effects.
