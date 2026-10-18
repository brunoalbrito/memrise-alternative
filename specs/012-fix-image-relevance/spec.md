# Feature Specification: Fix Image Relevance to the Chosen Sentence

**Feature Branch**: `012-fix-image-relevance`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "The image needs to be related with the sentenced selected by the user"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The picture shows the scene of the chosen sentence (Priority: P1)

In the AI suggestions panel the learner chooses an example sentence and the picture created for it must show the scene that sentence describes: the people, objects, action and place named in the sentence, with the word clearly visible in that scene. Today the picture only illustrates the word on its own and can look unrelated to the sentence the learner picked.

**Why this priority**: A picture that does not match the sentence is misleading on a vocabulary card, so the feature fails its purpose.

**Independent Test**: Auto-fill "humid", select each of the three sentences in turn, and verify that each picture visibly depicts what that particular sentence says and that the pictures differ from one another.

**Acceptance Scenarios**:

1. **Given** the suggestions are ready, **When** the picture is created for the selected sentence, **Then** it depicts the situation described by that sentence (for example the people, objects, action and setting it mentions) and the target word's meaning is clearly visible in it.
2. **Given** a picture is shown, **When** the learner selects a different sentence, **Then** the old picture disappears at once, "Creating image…" is shown, and the new picture depicts the newly selected sentence.
3. **Given** a picture is shown, **When** the learner looks at the Image section, **Then** the section states which sentence the picture was made for, so the learner can see the link.
4. **Given** a picture was made for a sentence, **When** the learner has since selected another sentence, **Then** that picture is never shown as current and never attached by Apply.
5. **Given** the learner presses "New image", **When** the new picture arrives, **Then** it again depicts the selected sentence (a different rendering of the same scene).

---

### Edge Cases

- Sentences that are abstract (for example about feelings or ideas): the picture shows a simple, concrete everyday scene that conveys the sentence, still without written text.
- The sentence mentions several things: the picture includes the main subject, action and setting, not every detail.
- The learner changes the sentence several times quickly: only the picture made for the last selected sentence is shown and attached.
- A picture request fails: the Image section shows its error and the caption is not shown for a missing picture.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The request that creates the picture MUST be based on the complete selected sentence and MUST ask for a scene that depicts what the sentence says (people, objects, action and setting), in which the meaning of the target word is clearly visible.
- **FR-002**: The picture MUST NOT contain written text, letters, numbers, captions or watermarks.
- **FR-003**: The Image section MUST show, next to a ready picture, the sentence it was made for.
- **FR-004**: A picture MUST only be shown as current, and only be attached by Apply, when it was made for the sentence that is selected at that moment. Selecting another sentence MUST remove the old picture immediately.
- **FR-005**: "New image" MUST create another picture for the selected sentence with the same scene requirements.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 90% of concrete example sentences, a reviewer can tell from the picture alone which of the three suggested sentences it was made for.
- **SC-002**: 100% of pictures shown or applied correspond to the sentence selected at that moment.
- **SC-003**: The sentence a picture was made for is visible beside it in 100% of ready states.

## Assumptions

- This fix refines the AI Word Image feature; panel layout, limits and storage rules stay as they are.
- Picture quality depends on Google's image model, so the app improves the instructions it sends and makes the link to the sentence visible; it cannot guarantee a perfect scene every time, which is why "New image" exists.
- Pictures stay square illustrations without text, reduced and saved as before.
