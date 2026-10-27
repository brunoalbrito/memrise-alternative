# Feature Specification: Skip AI Generation for Manually-Filled Fields

**Feature Branch**: `039-skip-ai-manual-fields`

**Created**: 2026-10-26

**Status**: Draft

**Input**: User description: "I need to make a strategy to safe tokens. At the screen Editing I need to not call for the word meaning, IPA, audio, images and examples if it was already filled manually."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Skip AI When User Fills Meaning (Priority: P1)

User is editing a word card and manually types the word meaning into the Meaning field. They trigger the AI wand to populate other fields. The system detects that Meaning is already filled and should NOT call AI to regenerate it, saving tokens and respecting the user's manual entry.

**Why this priority**: Core token-optimization behavior. Prevents wasted API calls on fields user has explicitly filled. Delivers direct cost savings.

**Independent Test**: Can be tested by entering a meaning manually, triggering AI wand, and verifying no AI call is made for that field.

**Acceptance Scenarios**:

1. **Given** Meaning field contains user-entered text, **When** user clicks AI wand icon, **Then** AI call excludes Meaning field (or doesn't request it)
2. **Given** Meaning field is empty, **When** user clicks AI wand icon, **Then** Meaning is populated by AI as normal

---

### User Story 2 - Skip AI for All Manually-Filled Metadata (Priority: P1)

User fills multiple fields (e.g., IPA, Meaning, Examples) manually on a word card. When they request AI help, the system skips regeneration for ALL fields that already contain content, generating only for empty fields (Images, Audio).

**Why this priority**: Generalized token-save across all metadata fields. Maximizes cost reduction and user control over card content.

**Independent Test**: Can be tested by pre-filling multiple fields, triggering AI wand, observing only empty fields are populated.

**Acceptance Scenarios**:

1. **Given** Word has user-filled: Meaning, IPA, Example; empty: Images, Audio, **When** user requests AI help, **Then** AI call only targets: Images and Audio
2. **Given** All metadata fields are manually filled, **When** user requests AI help, **Then** No AI call is made (or AI call is skipped entirely)
3. **Given** All metadata fields are empty, **When** user requests AI help, **Then** All fields are populated by AI

---

### User Story 3 - Visual Feedback on Skipped Fields (Priority: P2)

User sees which fields were skipped during AI generation. A visual indicator (e.g., badge, tooltip, log message) shows "Skipped: Meaning, IPA (already filled)" so they understand why some fields weren't populated.

**Why this priority**: Improves transparency and user confidence in AI behavior. Prevents confusion about why fields weren't updated.

**Independent Test**: Can be tested by running AI on pre-filled card and verifying visual feedback is shown for each skipped field.

**Acceptance Scenarios**:

1. **Given** Some fields are manually filled, **When** AI wand runs, **Then** UI shows summary of which fields were skipped and why
2. **Given** No fields are skipped, **When** AI wand runs, **Then** No skip message is shown

---

### Edge Cases

- What happens if user clears a field after manual entry, then requests AI? → AI should regenerate (field is now empty)
- What if a field contains only whitespace? → Treat as empty (regenerate with AI)
- What if user fills a field, AI regenerates another, then they request AI again? → Second request still respects the manually-filled field
- Can user force AI regeneration of a manually-filled field? → Out of scope for v1 (defer to future "regenerate field" UX)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect which metadata fields (Meaning, IPA, Audio, Images, Example) contain non-empty content before triggering AI
- **FR-002**: System MUST skip AI generation for all fields that are pre-filled with user content
- **FR-003**: System MUST only request AI for empty fields (fields with no text or attachments)
- **FR-004**: System MUST reduce token usage by excluding pre-filled fields from AI API payloads
- **FR-005**: System MUST preserve existing user-entered content and not overwrite it
- **FR-006**: System MUST display inline badge or icon on each skipped field (e.g., "↷ skipped") with tooltip showing "This field was not regenerated (already filled manually)"

### Key Entities

- **Word Card**: Represents a vocabulary item with metadata fields (word, meaning, IPA, audio, images, examples)
- **Metadata Field State**: Each field tracks whether it contains user content (filled) or is empty (eligible for AI)
- **AI Generation Request**: Payload sent to AI service; must conditionally exclude pre-filled fields

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Token usage per word-card generation reduced by at least 30% when user pre-fills fields
- **SC-002**: No AI calls are made for fields that contain user-entered content
- **SC-003**: User-manual content is never overwritten by AI regeneration
- **SC-004**: System response time for "skip check" is negligible (< 50ms overhead per request)

## Assumptions

- User manually fills fields by typing text directly into input fields or uploading files/images
- "Already filled" means field contains non-empty, non-whitespace-only content
- AI wand is the only trigger for batch metadata generation (not auto-save or background processes)
- Existing AI provider integration (Google Generative AI / Gemini) is reused; no new provider needed
- Visual feedback is optional for MVP but desired for UX clarity (marked as P2)
- Out of scope: manual per-field regenerate buttons, field-level AI toggle switches, or rollback of AI content
