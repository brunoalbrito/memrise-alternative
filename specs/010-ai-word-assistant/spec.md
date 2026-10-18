# Feature Specification: AI Word Assistant

**Feature Branch**: `010-ai-word-assistant`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "that is going to be the best feature of this application using the google aistudio api keys. I need to include a feature where the user when editing the course puts the word and gets back a simple definitions of the word, this word in a sentence (which it can select the best option) and audio of this word, and the IPA International Phonetic Alphabet, that is going to save a lot of time of the user making that manually. make this whole feature using speckit"

## Clarifications

### Session 2026-10-18

- Q: Where does the API key come from? → A: The learner pastes their own Google AI Studio key into the app. It is stored only on their device and is never built into the app.
- Q: In which language are the definition and sentences written? → A: The word's own language (the course's Teaching language). The app never translates; the speakers' language is not used by this feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get suggestions for a word (Priority: P1)

While editing a level, a learner types a word and presses an "Auto-fill" button on that word's row. The app asks Google's AI (through the learner's Google AI Studio key) and shows a suggestions panel with: a simple definition, a few example sentences using the word with the best one marked and pre-selected, the word's IPA (International Phonetic Alphabet) transcription, and a spoken audio of the word that can be played. The learner reviews it and presses "Apply": the definition fills the Meaning cell, the chosen sentence fills the Example cell, the IPA fills a new IPA cell and the audio is attached to the word's Audio cell. "Cancel" discards everything and changes nothing.

**Why this priority**: This is the core value: saving the learner the manual work of writing a definition, an example, the pronunciation and recording audio for each word.

**Independent Test**: With a valid key saved, type "humid" in a level, press Auto-fill, review the panel, press Apply, and verify Meaning, Example, IPA and one audio file appear on the word and survive a reload.

**Acceptance Scenarios**:

1. **Given** a word row with a non-empty Word and a saved key, **When** the learner presses "Auto-fill", **Then** a loading state is shown and then a panel with a definition, 3 example sentences (one marked "Best"), the IPA and a playable audio.
2. **Given** the suggestions panel, **When** the learner presses "Apply", **Then** Meaning, Example and IPA of that word are filled with the shown values (the selected sentence for Example), the audio is attached to the word, the panel closes, and Home and the course totals are unaffected.
3. **Given** the suggestions panel, **When** the learner presses "Cancel" or Escape, **Then** the panel closes and the word row is unchanged and nothing was attached.
4. **Given** a word row whose Word is empty, **When** the learner looks at the row, **Then** "Auto-fill" is disabled.
5. **Given** a request in progress for a word, **When** the learner presses "Auto-fill" again on that row, **Then** nothing new is started; other rows can still be used.
6. **Given** a word that already has a meaning, example, IPA or audio, **When** the learner presses "Apply", **Then** those values are replaced by the suggestions (and the learner chose to apply, so no further prompt is needed), while the existing audio files are kept and the new audio is added if the word has fewer than 5 audio files.

---

### User Story 2 - Connect my Google AI Studio key (Priority: P1)

Before using Auto-fill the learner connects their own Google AI Studio API key. A "Connect AI" control in the editor opens a dialog where the learner pastes the key, saves it, can check that it works, and can remove it. The key stays on the learner's device and is used only to call Google's AI. Without a key, pressing "Auto-fill" opens the same dialog.

**Why this priority**: Nothing works without a key, and the key is sensitive, so handling it clearly and safely is essential.

**Independent Test**: Press Auto-fill with no key: the connect dialog opens. Paste a valid key and save: Auto-fill now works. Remove the key: Auto-fill asks for a key again.

**Acceptance Scenarios**:

1. **Given** no saved key, **When** the learner presses "Auto-fill", **Then** a "Connect AI" dialog opens explaining what the key is for, with a link to where to get one, an input for the key, "Save" and "Cancel".
2. **Given** the dialog, **When** the learner saves a key, **Then** the key is stored on the device, the dialog confirms "AI connected" and, if it was opened by Auto-fill, the request continues.
3. **Given** a saved key, **When** the learner opens "AI settings", **Then** the key is shown masked (only the last 4 characters), with "Test connection" and "Remove key".
4. **Given** "Test connection", **When** the learner presses it, **Then** a small request is made and the dialog shows "Connection works" or the reason it failed.
5. **Given** "Remove key", **When** the learner confirms, **Then** the key is deleted from the device and Auto-fill asks for a key again.
6. **Given** an empty or obviously invalid key (blank, contains spaces), **When** the learner presses Save, **Then** a message beside the input explains the problem and nothing is saved.

---

### User Story 3 - Understand and recover from problems (Priority: P2)

When something goes wrong (no internet, wrong or expired key, usage limit reached, the AI refuses the word, the AI answers in an unusable way, or the request takes too long) the learner sees a clear message in the panel, can retry, and nothing in the course is changed.

**Why this priority**: AI calls fail in ordinary ways, and a silent failure would waste the learner's time and trust.

**Independent Test**: Try Auto-fill with a wrong key, with the network off, and with a nonsense word. Verify each shows its own message and leaves the word unchanged.

**Acceptance Scenarios**:

1. **Given** an invalid key, **When** a request is made, **Then** the panel says the key was not accepted and offers "Open AI settings".
2. **Given** no internet connection, **When** a request is made, **Then** the panel says it could not reach the AI service and offers "Try again".
3. **Given** the service's usage limit is reached, **When** a request is made, **Then** the panel says the limit was reached and to try again later.
4. **Given** the service takes longer than 30 seconds, **When** the learner waits, **Then** the request stops and the panel says it took too long, with "Try again".
5. **Given** an unusable answer (missing definition, sentences or IPA), **When** the response arrives, **Then** the panel says suggestions could not be prepared and offers "Try again"; any part that did arrive can still be applied only when the definition is present.
6. **Given** audio could not be generated but the text suggestions arrived, **When** the panel shows, **Then** it shows the text suggestions with a note "Audio could not be created" and Apply still works without audio.
7. **Given** any failure, **When** the learner closes the panel, **Then** the word row is exactly as before.

---

### User Story 4 - Choose the best example sentence and try again (Priority: P2)

The panel lists the suggested sentences as options. The AI marks the one it judges best for a learner ("Best") and it is selected by default. The learner can select a different sentence, edit nothing in the panel, and press "Try again" to ask for a fresh set of suggestions.

**Why this priority**: Letting the learner pick the sentence keeps quality in their hands while still saving time.

**Independent Test**: Open suggestions, confirm one sentence is marked Best and selected, select another, Apply, and verify the Example cell holds the chosen sentence. Press Try again and verify new suggestions replace the old ones.

**Acceptance Scenarios**:

1. **Given** the suggestions panel, **When** it opens, **Then** 3 sentences are listed as radio options with exactly one marked "Best" and selected.
2. **Given** the options, **When** the learner selects another sentence and presses Apply, **Then** the Example cell holds that sentence.
3. **Given** the panel, **When** the learner presses "Try again", **Then** a new request runs and the panel shows the new suggestions, with the Best sentence selected again.
4. **Given** the panel is open, **When** the learner changes nothing and presses Apply, **Then** the Best sentence is used.

---

### User Story 5 - Keep IPA with the word (Priority: P3)

The words table has a new "IPA" column. The learner can type or correct the IPA by hand, and the value is saved with the word and shown in the course editor after reloading. The IPA text is shown in slashes in the table (for example /ˈhjuːmɪd/ stays stored without slashes and is displayed with them).

**Why this priority**: The IPA must live somewhere editable, and it also works without the AI.

**Independent Test**: Type an IPA by hand for a word, reload, and verify it is still there. Apply AI suggestions and verify the IPA cell holds the AI's value and can be edited.

**Acceptance Scenarios**:

1. **Given** the words table, **When** the editor opens, **Then** an "IPA" column sits between "Audio" and "Meaning".
2. **Given** an IPA cell, **When** the learner types or edits a value, **Then** it is saved and survives a reload.
3. **Given** an IPA value, **When** the cell is not focused, **Then** it is displayed between slashes (for example "/ˈhjuːmɪd/").

---

### Edge Cases

- Word is a phrase or contains several words (for example "laundry folding"): suggestions are prepared for the whole phrase.
- Very long text in the Word cell: the request is not sent and the panel says to use a shorter word or phrase (limit 60 characters).
- A word in a script other than the course's Teaching language: the AI is told the course's Teaching language, and its answer is applied as given; the learner reviews it before applying.
- Word with several meanings: the definition covers the most common meaning, in simple language.
- The audio would make the word exceed 5 audio files: text values are still applied, audio is not attached, and the message "This word already has 5 audio files." is shown.
- Generated audio larger than 3 MB or storage full: the audio is skipped with a message and text values are still applied.
- The key is removed or becomes invalid between pressing Auto-fill and the answer: the panel shows the invalid-key message.
- Learner leaves the editor tab while a request runs: the request is cancelled and nothing is applied.
- Panel left open while the learner edits the word: Apply uses the suggestions made for the word as it was when the request started, and the panel shows which word it was for.
- Slow or repeated use: only one request per word row at a time; the learner can run requests on different rows at once.
- Privacy: the word text and the course's Teaching language are sent to Google; nothing else from the course is sent, and the key is never shown in full after saving.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each word row MUST have an "Auto-fill" button that is disabled while the Word is empty or longer than 60 characters after trimming.
- **FR-002**: Pressing "Auto-fill" MUST send the word and the course's Teaching language to Google's AI and show a suggestions panel for that word with: a simple definition, exactly 3 example sentences with one marked "Best" and selected, the IPA transcription, and a playable audio of the word.
- **FR-003**: The suggested definition MUST be short (at most 25 words) and in simple language, and each sentence MUST be one sentence of at most 25 words that contains the word or its inflected form. Both are written in the word's own language (the course's Teaching language) and are never translated.
- **FR-004**: The learner MUST be able to select any suggested sentence. "Try again" MUST request a new set of suggestions.
- **FR-005**: "Apply" MUST fill Meaning with the definition, Example with the selected sentence and IPA with the transcription, MUST attach the audio to the word (counting toward the 5 audio files limit), and MUST close the panel. "Cancel" and Escape MUST close it without changing anything.
- **FR-006**: The generated audio MUST be stored like any imported audio file (kept on the device, playable and removable from the Audio cell dropdown, same size limits) with a file name of the form `<word>.wav`.
- **FR-007**: The words table MUST have an "IPA" column between "Audio" and "Meaning". IPA MUST be editable by hand, saved with the word, and displayed between slashes when not focused.
- **FR-008**: The learner MUST be able to connect, test and remove their Google AI Studio API key from a "Connect AI" dialog in the editor. Without a key, "Auto-fill" MUST open that dialog. The key is always the learner's own; no key is built into the app.
- **FR-009**: The key MUST never appear in the page after saving except masked (last 4 characters), MUST never be written to logs or the console, and MUST never be sent anywhere except Google's AI service.
- **FR-010**: Only one request per word row MUST run at a time, a request MUST stop after 30 seconds, and leaving the editor MUST cancel running requests.
- **FR-011**: On failure the panel MUST show a plain-language message for each of: invalid key, no connection, usage limit reached, timeout, refusal, unusable answer, and audio not created, offer "Try again" or "Open AI settings" where relevant, and leave the word unchanged.
- **FR-012**: Applying suggestions MUST count toward course totals only through the Word text (no change to word counts) and MUST save immediately, surviving a reload.
- **FR-013**: The dialog MUST explain in plain words that the word and the course's Teaching language are sent to Google and that the key is stored on this device only.
- **FR-014**: The panel, dialog and new controls MUST be keyboard operable, announce loading and errors to assistive technology, work from 360 px width and follow the project's Material Design 3 guidelines.

### Key Entities *(include if feature involves data)*

- **Word**: Gains an IPA value (text, optional). Meaning, Example and audio stay as before.
- **AI key**: The learner's Google AI Studio API key. Stored on the device only, used to call the AI service, shown masked.
- **Word suggestion**: A temporary result for one word: definition, list of 3 example sentences with the index of the best one, IPA and generated audio. It exists only while the panel is open.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a key is connected, a learner can go from typing a word to having its meaning, example, IPA and audio saved in under 20 seconds, including review.
- **SC-002**: For 95% of common words, suggestions arrive within 10 seconds.
- **SC-003**: 100% of failed requests leave the word unchanged and show a message that names the cause.
- **SC-004**: 100% of applied suggestions survive a reload.
- **SC-005**: The key is never visible in full after saving in 100% of checks.
- **SC-006**: Every new control (Auto-fill, panel options, dialog, IPA cell) can be used with the keyboard alone, and the panel and dialog are usable from 360 px width.

## Assumptions

- The AI service is Google's Gemini API reached with a Google AI Studio API key, as requested. The app has no server, so requests go from the learner's browser to Google.
- This feature adds to the Course Editor feature: it needs the words table, the Audio cell and media storage built there.
- Prototype constraints still apply: no accounts, one anonymous learner, all data (including the key) saved on the device only.
- Sentences are chosen by the AI ("Best") and confirmed by the learner; the learner can always edit the cells by hand afterward.
- The word to look up is the Word cell's text. Single words and short phrases up to 60 characters are supported.
- Free-tier usage limits of the AI service apply, and reaching them is handled as described in FR-011.
- The app never translates content. Definitions, sentences, IPA and audio are all in the course's Teaching language.
- Generated audio is a spoken pronunciation of the word in the course's Teaching language, saved as a standard audio file.
- IPA is stored as plain text without the surrounding slashes.
