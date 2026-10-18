# Feature Specification: Pollinations Image Provider

**Feature Branch**: `013-pollinations-images`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Okay, so lets use the Pollinations.ai for image generation. I already have a key on my hands"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create the word picture with Pollinations (Priority: P1)

The learner saves their Pollinations key once. From then on, the picture in the AI suggestions panel is created by Pollinations instead of Google, for the sentence selected, and everything else about the picture stays the same: it follows the selected sentence, shows which sentence it was made for, can be replaced with "New image", and is attached to the word's Images when the learner presses "Apply". The definition, sentences, IPA and audio keep coming from Google.

**Why this priority**: A free Google account cannot create images, so without this the picture part of Auto-fill does not work for the learner.

**Independent Test**: With a saved Pollinations key, press Auto-fill on "humid", wait for the picture, press Apply, and verify one image is attached and survives a reload. Confirm no image request goes to Google.

**Acceptance Scenarios**:

1. **Given** a saved Pollinations key and ready suggestions, **When** the Image section starts, **Then** "Creating image…" is shown and then a picture that depicts the selected sentence with the caption "Made for: “…”".
2. **Given** a picture is shown, **When** the learner selects another sentence or presses "New image", **Then** a new picture is created for the selected sentence, as before.
3. **Given** the picture is ready, **When** the learner presses Apply, **Then** it is attached to the word's Images as before (same size and count limits).
4. **Given** the learner has no Google key but only a Pollinations key, **When** Auto-fill runs, **Then** the learner is asked for the Google key (needed for the text), and no picture is requested until the text suggestions exist.
5. **Given** a picture request, **When** it is made, **Then** it goes only to Pollinations and the Google key is not sent to Pollinations; the Pollinations key is not sent to Google.

---

### User Story 2 - Save and manage the Pollinations key (Priority: P1)

The "Connect AI" dialog gets a second section for the Pollinations key, next to the Google key: paste and save it, see it masked (last 4 characters), and remove it. The key stays on the learner's device. An optional "Image model" field lets the learner choose a Pollinations model; left empty, Pollinations' own default is used.

**Why this priority**: The learner already has a key and needs a safe place to put it.

**Independent Test**: Save a Pollinations key and see it masked, reload and see it still saved, remove it and see Auto-fill's Image section ask for it again.

**Acceptance Scenarios**:

1. **Given** the Connect AI dialog, **When** it opens, **Then** it shows a "Pollinations API key (for images)" section with an input, "Save" and "Remove key", and the existing Google key section.
2. **Given** a key typed in the Pollinations input, **When** the learner saves it, **Then** it is stored on the device, "Pollinations connected." is shown and the input empties; the key is shown only masked afterward.
3. **Given** an empty key or a key with spaces, **When** the learner saves, **Then** "Enter your API key without spaces." is shown and nothing is saved.
4. **Given** a saved Pollinations key, **When** the learner removes it and confirms, **Then** it is deleted from the device.
5. **Given** the "Image model" field, **When** the learner leaves it empty, **Then** Pollinations' default model is used; when filled, that model name is used.
6. **Given** earlier saved settings with the old Google image model name, **When** the app starts, **Then** that old value is ignored and the image model is empty.

---

### User Story 3 - Understand image problems (Priority: P2)

When the picture cannot be created the Image section explains why in plain words: no Pollinations key saved, key not accepted, balance or budget used up, rate limit, no connection, timeout, or the service had a problem. Where the fix is the key, it offers "Open AI settings", otherwise "New image". The text, IPA and audio can always still be applied.

**Why this priority**: Free and community services fail in ordinary ways and the learner must know what to do.

**Independent Test**: Try with no key, a wrong key, and the network off. Verify each shows its own message and Apply still works.

**Acceptance Scenarios**:

1. **Given** no Pollinations key, **When** the suggestions are ready, **Then** the Image section says "Add your Pollinations key in AI settings to create images." with "Open AI settings", and no image request is sent.
2. **Given** a key Pollinations rejects, **When** a picture is requested, **Then** the section says "Pollinations did not accept your key. Check it in AI settings." with "Open AI settings".
3. **Given** the account or key budget is used up, **When** a picture is requested, **Then** the section says "Your Pollinations balance or budget is used up." with "New image".
4. **Given** a rate limit, no connection, a timeout or a service problem, **When** a picture is requested, **Then** the section shows the matching message ("The usage limit was reached. Try again later.", "Could not reach the AI service. Check your connection and try again.", "The AI service took too long. Try again.", or "Image could not be created.") with "New image".
5. **Given** any image failure, **When** the learner presses Apply, **Then** the other values are applied and no image is attached.

---

### Edge Cases

- The picture arrives in a type the editor does not accept (for example a vector image): it is skipped with the editor's usual "Choose a PNG, JPEG, GIF or WebP image." message while the text and audio are applied.
- The picture is larger than 2 MB: it is reduced as before; if it still cannot be used it is skipped with the size message.
- The learner changes sentences quickly: only the picture for the last selected sentence is kept; earlier requests are cancelled, as before.
- The Pollinations key is removed while a picture is being created: the section shows the key message.
- Privacy: the word and the selected sentence are sent to Pollinations to create the picture, and the learner is told so; the Pollinations key is never shown in full, logged, or placed in a web address.
- A Pollinations "secret" key is powerful: the dialog warns the learner to use a key with a spending limit and to remove it on shared computers.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Pictures in the suggestions panel MUST be created by Pollinations. Google MUST NOT receive image requests.
- **FR-002**: The picture MUST depict the scene of the selected sentence with the word's meaning visible and no written text; all selection, caption, "New image", Apply and cancellation behavior from the earlier Image features MUST be unchanged.
- **FR-003**: The Connect AI dialog MUST let the learner save, see (masked, last 4 characters) and remove a Pollinations key, and set an optional image model name (empty means Pollinations' default).
- **FR-004**: The Pollinations key MUST be stored only on the device, sent only to Pollinations in the request headers, never put in a web address, never logged and never included in messages.
- **FR-005**: The word and selected sentence MUST be the only course content sent to Pollinations, and the dialog's privacy text MUST say they are sent to Pollinations.
- **FR-006**: With no Pollinations key saved, the Image section MUST show "Add your Pollinations key in AI settings to create images." with "Open AI settings" and MUST NOT send a request.
- **FR-007**: Failures MUST show these messages: key not accepted "Pollinations did not accept your key. Check it in AI settings." with "Open AI settings"; budget used up "Your Pollinations balance or budget is used up." with "New image"; the existing messages for rate limit, no connection and timeout; and "Image could not be created." for anything else.
- **FR-008**: The picture MUST be requested at a moderate size (768 by 768) and reduced and saved as before, within the existing 2 MB and 5-image rules.
- **FR-009**: Settings saved before this feature that name a Google image model MUST be ignored.
- **FR-010**: New controls MUST be keyboard operable, announce loading and errors, work from 360 px width and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **AI settings**: Gain a Pollinations key (text, empty means not connected) and an image model name (text, empty means default). The old Google image model setting is dropped.
- **Image request**: A temporary request for one word and one sentence, answered with a picture or an error.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With a valid key, a picture appears within 30 seconds for 90% of requests.
- **SC-002**: 100% of image requests go to Pollinations and none to Google.
- **SC-003**: 100% of image failures name a cause or action and leave the other suggestions applicable.
- **SC-004**: The Pollinations key is never visible in full after saving in 100% of checks, and never appears in a request address.
- **SC-005**: Every new control can be used with the keyboard alone and the dialog stays usable from 360 px width.

## Assumptions

- This replaces the Google image generation of the AI Word Image feature; text, IPA and audio stay on Google.
- The learner's key is for Pollinations' image service, and their account or key rules decide the cost and limits.
- Pollinations is a community-run service without a service guarantee; availability and rules may change.
- Pictures stay square illustrations reduced to a small JPEG, attached as `<word>.jpg`.
- The picture is still created automatically when the suggestions are ready and when another sentence is selected.
