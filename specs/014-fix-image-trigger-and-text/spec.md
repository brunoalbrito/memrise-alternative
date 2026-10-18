# Feature Specification: Fix Image Trigger and Text in Pictures

**Feature Branch**: `014-fix-image-trigger-and-text`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "there are two problems. The image is generated before the phrase selection. And its also bring the text in the image, i dont wanna it happens [screenshot: a picture showing the full example sentence written in the image above three runners]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create the picture only after I choose a sentence (Priority: P1)

When the AI suggestions open, no picture is created yet. The Image section says to select a sentence. The picture is only created once the learner chooses a sentence by clicking one of the options (including the one marked "Best" that is already selected), and again whenever the learner chooses a different sentence. A "Create image" button in the section is also available for the selected sentence, so it can be done from the keyboard. Apply works with or without a picture.

**Why this priority**: Pictures cost credit and time. Creating one before the learner has chosen the sentence wastes both and shows a picture for a sentence the learner may not want.

**Independent Test**: Open suggestions: no image request is sent and the Image section asks for a selection. Click a sentence: "Creating image…" starts for that sentence. Click another: a new picture for it.

**Acceptance Scenarios**:

1. **Given** the suggestions just appeared, **When** the learner looks at the Image section, **Then** it reads "Select a sentence to create its image." with a "Create image" button, and no picture request has been sent.
2. **Given** the suggestions are shown, **When** the learner clicks a sentence option (any option, including the one already selected), **Then** "Creating image…" starts for that sentence.
3. **Given** a picture is shown for a sentence, **When** the learner clicks that same sentence again, **Then** nothing new is created.
4. **Given** a picture is shown, **When** the learner clicks a different sentence, **Then** the old picture disappears at once and a new one is created for the newly chosen sentence.
5. **Given** no picture has been created, **When** the learner presses Apply, **Then** the text values and audio are applied and no image is attached.
6. **Given** the learner presses "Create image", **When** no picture exists for the selected sentence, **Then** a picture is created for it.
7. **Given** the learner presses "Try again" for the text, **When** new suggestions arrive, **Then** the picture is cleared and no new picture is created until a sentence is chosen.

---

### User Story 2 - No writing inside the picture (Priority: P1)

The picture must be a purely visual illustration of the scene. It must not contain the sentence, the word or any other writing: no words, letters, numbers, captions, signs, labels or speech bubbles.

**Why this priority**: Text in the picture duplicates the card text, is often misspelled by the image model and makes the picture useless for learning.

**Independent Test**: Create pictures for ten different sentences and verify none contains readable writing.

**Acceptance Scenarios**:

1. **Given** a chosen sentence, **When** the picture is created, **Then** the picture shows the scene with its people, objects, action and setting and contains no written text of any kind.
2. **Given** a sentence that mentions writing or signs (for example "She read the sign"), **When** the picture is created, **Then** the picture shows the situation without legible writing.
3. **Given** the scene cannot be prepared (for example the Google key is unavailable), **When** the picture is created, **Then** it is still requested with strong "no text" instructions and without the sentence quoted.

---

### Edge Cases

- Clicking an option repeatedly in the same spot: only one request is made for that sentence.
- Choosing sentences quickly: only the picture for the last chosen sentence is kept; earlier requests are cancelled.
- A picture failed for a sentence: clicking the same sentence again (or "Create image") tries again.
- The learner never chooses a sentence: no picture is created and Apply attaches none.
- Cancel, Escape and closing cancel any running request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Opening the suggestions MUST NOT create a picture. The Image section MUST show "Select a sentence to create its image." and a "Create image" button until a picture is requested.
- **FR-002**: A picture request MUST start when the learner clicks a sentence option (including an option that is already selected), unless a picture for that sentence is already ready or being created. "Create image" MUST start one for the selected sentence.
- **FR-003**: Choosing a different sentence MUST cancel any running request, remove the current picture at once and create a new picture for the chosen sentence.
- **FR-004**: "Try again" (text) MUST clear the picture and MUST NOT create a new one until a sentence is chosen.
- **FR-005**: The picture MUST NOT contain any written text, letters, numbers, captions, signs, labels or speech bubbles.
- **FR-006**: The picture request MUST NOT contain the sentence as quoted text. It MUST be built from a short, purely visual description of the scene that the sentence implies, with explicit instructions that the image contains no text of any kind.
- **FR-007**: If the visual description cannot be prepared, the picture MUST still be requested using the sentence rewritten as an unquoted scene instruction with the same no-text instructions.
- **FR-008**: Apply MUST work with or without a picture; it attaches a picture only when one is ready for the selected sentence. All earlier Image rules (caption, "New image", cancellation, size limits) stay.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of suggestion panels open without any picture request being sent.
- **SC-002**: 100% of pictures are created for the sentence the learner chose most recently.
- **SC-003**: At least 95% of pictures created for ordinary example sentences contain no readable writing.

## Assumptions

- This refines the AI Word Image, Image Relevance and Pollinations features.
- The scene description is an internal instruction in English for the image service and is not shown to the learner or stored. It is not a translation of the learner's content.
- The scene description comes from the same Google text model that makes the suggestions, using the learner's existing Google key (free tier is enough).
- Image models can occasionally still draw writing; "New image" lets the learner try again.
