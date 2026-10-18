# Research: AI Word Assistant

## R1. Where the API key lives (spec clarification)
- **Decision**: The learner pastes their own Google AI Studio key. It is saved in `localStorage`
  (`membetter.ai`) on the device only, sent only in the `x-goog-api-key` request header, shown
  masked (last 4 characters) and never logged.
- **Rationale**: The app has no server, so a built-in key would sit in the page for anyone to copy.
  Browser storage is readable by any script on the page, so the app has no third-party scripts and
  the dialog tells the learner to use a key with usage limits and to remove it on shared computers.
- **Alternatives**: A key in a build-time variable (ends up in the shipped page and the repo
  pipeline); a proxy server (not part of this project).

## R2. Which Google API and models
- **Finding** (Google's docs fetched on 2026-10-18): text and speech are documented on the
  Interactions API, `POST /v1beta/interactions`, with `x-goog-api-key` auth. Text examples use
  `gemini-3.8-flash` (cheap option `gemini-3.5-flash-lite`); speech examples use
  `gemini-3.8-flash-tts`, while another page lists `gemini-3.1-flash-tts-preview`. The older
  `generateContent` API "remains fully supported" but is called legacy.
- **Decision**: Use the Interactions API. Defaults: text model `gemini-3.8-flash`, speech model
  `gemini-3.8-flash-tts`, both editable in the AI settings dialog ("Models" section) and restorable
  to defaults. Model ids and the request shapes are isolated in `api/gemini.ts` and described in
  `contracts/gemini-api.md`.
- **Rationale**: It is the documented current API. Editable model ids make a renamed or retired
  model a settings change rather than a code change.
- **Caveat**: The fetched pages did not show every response field and were not run against a live
  key. Response parsing is defensive (R9) and "Test connection" exists so the first real run
  reveals problems early.
- **Alternatives**: `generateContent` (legacy); a Google SDK (new dependency, not needed).

## R3. Getting definition, sentences and IPA
- **Decision**: One text request returns JSON through the structured-output `response_format`
  (`type: "text"`, `mime_type: "application/json"`, a JSON schema with lowercase types):
  `definition` (string), `sentences` (array of 3 strings), `best` (integer 0 to 2) and `ipa`
  (string). The prompt names the course's Teaching language (for example "English (US)"), asks for
  a definition of at most 25 words in simple language, exactly 3 natural sentences of at most 25
  words that contain the word or an inflected form, the index of the clearest sentence for a
  learner, and IPA without slashes in the dialect of the language. The word is passed as quoted
  data and the prompt tells the model to treat it only as text to describe.
- **Rationale**: One round trip for all text values (SC-001, SC-002); the model picks the best
  sentence (US4). No translation is ever requested (spec clarification).
- **Alternatives**: Separate requests per value (slower, more quota).

## R4. Getting the audio
- **Decision**: A second request to the speech model with the word as input, `response_format`
  `{ type: "audio", mime_type: "audio/wav" }` and the voice `Kore` (a constant in `gemini.ts`).
  The reply is base64 WAV (24 kHz, mono, 16-bit). If the reply is raw PCM instead of a WAV, wrap it
  in a RIFF/WAV header.
- **Rationale**: FR-006 needs a standard audio file that plays in `<audio>` and can be stored with
  the existing media code. A short word is far below the 3 MB limit (about 50 KB per second).
- **Alternatives**: The browser's built-in speech synthesis (cannot be saved as a file).
- **Run in parallel** with the text request; an audio failure never blocks the text (US3
  scenario 6).

## R5. Request lifecycle
- **Decision**: `useSuggestions` runs both requests under one `AbortController` with a 30 s timeout
  (`AbortSignal.timeout` combined with a manual controller for unmount), and cancels on unmount
  and on "Cancel". States: `idle`, `loading`, `ready`, `error`. Only one run per word row.
- **Rationale**: FR-010 and the edge cases.

## R6. Error mapping
- **Decision**: `AiError` kinds with exact learner messages (see contract): `invalid-key` (HTTP
  400 with an API-key message, 401, 403), `limit` (429), `network` (fetch `TypeError`),
  `timeout` (abort by timeout), `refused` (no usable candidate or a block/safety reason),
  `unusable` (missing or malformed fields), `service` (other 5xx or unknown status), `audio`
  (speech request failed or returned nothing).
- **Rationale**: FR-011. Error text never includes the key or the raw response body.

## R7. Applying a suggestion
- **Decision**: `AutoFill` returns `{ definition, sentence, ipa, audio?: Blob }` to its parent. The
  editor's `LevelsTab` applies it: updates Meaning, Example and IPA through `levelOps.updateWord`,
  and for audio builds a `File` named `<word>.wav` (type `audio/wav`), runs the existing
  `validateMediaFile` (type, 3 MB, 5-file limit), stores it with `putMedia`, attaches it with
  `attachMedia`, and shows a notice if audio was skipped ("This word already has 5 audio files.",
  size or storage message).
- **Rationale**: Reuses the editor's media rules and persistence; the AI module does not know
  editor internals.

## R8. IPA column
- **Decision**: `Word.ipa?: string` (plain text, stored without slashes; leading and trailing
  slashes are stripped on save). The table gets an "IPA" column between Audio and Meaning. The
  input shows `/ipa/` when not focused and the raw text when focused. Existing words have no
  `ipa`, handled as empty (no migration).
- **Rationale**: FR-007 and US5.

## R9. Defensive response parsing
- **Decision**: `extractText(json)` reads `output_text` if present, else concatenates `text` of
  `steps[].content[]` items of type text, else `candidates[0].content.parts[].text` (legacy shape).
  `extractAudio(json)` returns the base64 `data` of the first `steps[].content[]` item that has
  one, else `candidates[0].content.parts[].inlineData.data`. JSON text may arrive in a markdown
  code fence and is unwrapped before `JSON.parse`. Parsed values are validated: definition
  non-empty; 1 to 3 sentences (extra ones dropped); `best` clamped to a valid index; `ipa`
  non-empty. Anything else is `unusable`.
- **Rationale**: The documentation excerpts did not show full response shapes, so tolerant
  parsing keeps the feature working across small API differences.

## R10. Connect dialog
- **Decision**: Native `<dialog>` with a password-type input (`autocomplete="off"`), a link to
  `https://aistudio.google.com/apikey`, privacy text (FR-013), Save, Test connection, Remove key
  and Cancel. Saving requires a non-empty key without whitespace. Test connection sends a minimal
  text request and reports "Connection works" or the mapped error. A collapsed "Models" section
  holds the two model id inputs and "Restore defaults".
- **Rationale**: US2; model ids editable per R2.

## R11. Auto-fill without a key
- **Decision**: With no saved key, Auto-fill opens the connect dialog; after Save the suggestion
  request starts automatically.
- **Rationale**: US2 scenario 1 and 2.

## Resolved unknowns

None remained in Technical Context. Open verification: run "Test connection" and one Auto-fill
with a real key to confirm the model ids and response shapes (quickstart scenario 2).
