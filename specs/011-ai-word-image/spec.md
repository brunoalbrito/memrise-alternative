# Feature Specification: AI Word Image

**Feature Branch**: `011-ai-word-image`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "I am missing one important feature. After the user selects the phrase suggested, it should generate an image to and include that"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get an image for the chosen sentence (Priority: P1)

In the AI suggestions panel (Auto-fill), once the learner has a sentence selected, the app creates a picture that illustrates the word as used in that sentence and shows it in the panel. The Best sentence is selected when the suggestions open, so the picture starts being created right away; when the learner selects a different sentence, a new picture is created for it. When the learner presses "Apply", the picture is added to the word's Images cell together with the definition, sentence, IPA and audio.

**Why this priority**: Pictures are the most memorable part of a vocabulary card, and making them by hand takes the most time of all the parts.

**Independent Test**: With a saved key, press Auto-fill on "humid", wait for the picture, press Apply, and verify one image is attached to the word, can be viewed from the Images dropdown and survives a reload.

**Acceptance Scenarios**:

1. **Given** the suggestions are ready with a sentence selected, **When** the panel shows them, **Then** an "Image" section shows "Creating image…" and then a picture made for the selected sentence.
2. **Given** a picture is shown, **When** the learner selects a different sentence, **Then** the current picture is replaced by "Creating image…" and then by a new picture made for the newly selected sentence.
3. **Given** a picture is shown, **When** the learner presses Apply, **Then** the picture is added to the word's Images (the existing images are kept) along with the other values, and it can be viewed and removed from the Images dropdown.
4. **Given** a picture is still being created, **When** the learner looks at Apply, **Then** Apply waits (disabled) until the picture is ready or has failed.
5. **Given** the picture was added, **When** the learner reloads the app, **Then** it is still attached and can still be viewed.
6. **Given** the learner presses Cancel or Escape, **When** the panel closes, **Then** nothing is attached and a picture request in progress is cancelled.

---

### User Story 2 - Make a new picture (Priority: P2)

If the learner does not like the picture, a "New image" button in the Image section creates another one for the selected sentence. Each press replaces the picture shown; only the picture shown when Apply is pressed is kept.

**Why this priority**: Generated pictures vary, so the learner needs a quick way to ask again without redoing the text suggestions.

**Independent Test**: Press "New image" twice and verify the picture changes, the text suggestions stay as they were, and Apply attaches only the last picture.

**Acceptance Scenarios**:

1. **Given** a picture is shown, **When** the learner presses "New image", **Then** "Creating image…" is shown and a new picture replaces the old one; the definition, sentences, IPA and audio are unchanged.
2. **Given** a new picture is being created, **When** the learner presses "New image" again, **Then** nothing new starts until the current request ends.
3. **Given** the learner presses Apply, **When** several pictures were created, **Then** only the picture currently shown is attached.

---

### User Story 3 - Recover when the picture cannot be made (Priority: P2)

If the picture cannot be created (usage limit, no connection, timeout, the service refuses the request, or the key does not allow image creation), the Image section says so in plain words and offers "New image". The rest of the suggestions can still be applied without a picture.

**Why this priority**: Image creation is the most likely part to fail or be refused, and it must not block the rest.

**Independent Test**: Turn the network off right after the suggestions appear and select another sentence: the Image section shows the message while Apply still works for the text and audio.

**Acceptance Scenarios**:

1. **Given** the picture request fails, **When** the Image section updates, **Then** it shows the message "Image could not be created." with the reason where known, plus "New image", and Apply is enabled.
2. **Given** the picture request fails, **When** the learner presses Apply, **Then** the other values are applied and no image is attached.
3. **Given** the word already has 5 images, **When** the learner presses Apply, **Then** the other values are applied, no image is attached and the editor shows "This word already has 5 images."
4. **Given** the picture is larger than the allowed size even after it is reduced, or storage is full, **When** the learner presses Apply, **Then** the other values are applied, the image is skipped and the editor shows the matching message.

---

### Edge Cases

- Sentence selection changes quickly several times: only the picture for the last selected sentence is kept; earlier requests are cancelled.
- "Try again" for the text suggestions: the previous picture is discarded and a new one is created for the new best sentence.
- The picture must not contain written text, letters or captions, so it works for any language.
- Pictures are reduced to a small standard size so that they stay under the 2 MB image limit.
- The key is removed or becomes invalid while a picture is being created: the Image section shows the invalid-key message.
- Panel closed while a picture is being created: the request is cancelled and nothing is attached.
- Privacy: the word, the selected sentence and the course's Teaching language are sent to Google for the picture; nothing else from the course is sent.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the suggestions are ready, the panel MUST show an "Image" section and MUST start creating a picture for the word and the currently selected sentence.
- **FR-002**: Selecting a different sentence MUST cancel any running picture request and create a new picture for that sentence. Only one picture request per panel runs at a time.
- **FR-003**: The picture MUST illustrate the meaning of the word as used in the selected sentence, MUST be a simple, clear illustration, and MUST NOT contain written text.
- **FR-004**: The Image section MUST show "Creating image…" while loading (announced politely), the picture when ready, and a message with a "New image" button on failure.
- **FR-005**: A "New image" button MUST create another picture for the selected sentence and replace the one shown, without changing the text suggestions or the audio.
- **FR-006**: "Apply" MUST be disabled while a picture is being created. When pressed, it MUST attach the shown picture to the word's Images (keeping existing images) as a JPEG named `<word>.jpg`, counting toward the 5 images limit, in addition to the definition, sentence, IPA and audio.
- **FR-007**: The attached picture MUST follow the existing image rules (at most 2 MB, at most 5 images per word), be stored on the device, be viewable and removable from the Images dropdown and survive reloading the app. Pictures MUST be reduced in size before being stored so that they normally stay well under 2 MB.
- **FR-008**: If the picture cannot be created or attached (failure, limit, size or storage), the other suggestions MUST still be applied, and the learner MUST see which part was skipped and why.
- **FR-009**: Cancel, Escape and closing the panel MUST cancel any running picture request and attach nothing.
- **FR-010**: The "Connect AI" dialog MUST let the learner change the image model next to the other models and restore its default, and its privacy text MUST state that the chosen sentence is also sent to Google.
- **FR-011**: The new controls MUST be keyboard operable, announce loading and errors to assistive technology, work from 360 px width and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Word image suggestion**: A temporary picture for one word and one selected sentence, shown in the panel until Apply, a new picture, a different sentence or closing.
- **AI settings**: Gain an image model name (editable, restorable to default).
- **Word**: Its Images list may receive the applied picture (an ordinary image file).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After the suggestions appear, a picture is shown within 20 seconds for 90% of common words.
- **SC-002**: 100% of applied pictures are attached to the word, viewable from the Images dropdown and still there after a reload.
- **SC-003**: 100% of picture failures leave the text suggestions usable and name the cause where it is known.
- **SC-004**: 100% of pictures shown are for the sentence selected at the time they were requested (no picture for an earlier sentence is applied).
- **SC-005**: Every new control can be used with the keyboard alone and the panel stays usable from 360 px width.

## Assumptions

- This feature extends the AI Word Assistant, which provides the key, the suggestions panel and Apply.
- Pictures are created with Google's image generation through the learner's own Google AI Studio key, like the text and audio.
- A picture is a square illustration, reduced to at most 768 px on its longest side and saved as JPEG.
- The picture starts being created automatically for the selected sentence because the Best sentence is selected by default; the learner can still select another one.
- Free-tier limits may apply to image creation and are reported through the existing "usage limit" message.
- The picture is a suggestion: the learner can remove it from the Images dropdown at any time.
- Nothing is translated and no text is drawn into pictures.
