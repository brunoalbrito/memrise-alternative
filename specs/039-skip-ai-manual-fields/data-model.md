# Data Model: Skip AI Generation for Manually-Filled Fields

**Created**: 2026-10-26 | **Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

---

## Entities

### 1. Word

Represents a single vocabulary item in a level/course.

```
Word {
  id: string                    // Unique identifier
  word: string                  // The word itself (immutable)
  meaning?: string              // User-provided or AI-generated definition
  ipa?: string                  // Phonetic pronunciation (user or AI)
  example?: string              // Usage example (user or AI)
  imageIds?: string[]           // References to image attachments
  audioId?: string              // Reference to audio file
}
```

**Relationships**:
- Belongs to one Level (parent)
- Images and audio are stored separately in file system; Word holds references

**Validation**:
- `word` is required, non-empty, non-whitespace
- Other fields are optional (can be empty)
- `imageIds` and `audioId` reference valid files in local storage

---

### 2. FieldState

Tracks whether a word's metadata field contains user-entered content or is eligible for AI generation.

```
FieldState {
  word: Word
  
  // Per-field state (true = filled, false = empty)
  fields: {
    meaning: boolean
    ipa: boolean
    example: boolean
    images: boolean
    audio: boolean
  }
}
```

**State Calculation Logic**:
```
meaning:   word.meaning?.trim().length > 0 ? filled : empty
ipa:       word.ipa?.trim().length > 0 ? filled : empty
example:   word.example?.trim().length > 0 ? filled : empty
images:    word.imageIds?.length > 0 ? filled : empty
audio:     word.audioId ? filled : empty
```

**Transitions**:
- User types text → field changes from empty to filled
- User clears text → field changes from filled to empty
- AI generates content → field becomes filled (if previously empty)
- User replaces AI content → field remains filled (user intent)

---

### 3. AIGenerationRequest

Represents a request to populate missing metadata for a word.

```
AIGenerationRequest {
  word: string                  // The word to generate metadata for
  requestedFields: string[]     // Fields user wants populated
  skipFields: string[]          // Fields to exclude from AI (pre-filled)
  context?: {
    courseLanguage?: string     // Language context
    level?: number              // Difficulty level
  }
}
```

**Calculation of skipFields**:
```
skipFields = word's fields that are filled (based on FieldState)
requestedFields = requested fields minus skipFields
```

**Example**:
- Word has: meaning (filled), example (filled), images (empty), audio (empty)
- User requests AI → skipFields = [meaning, example], requestedFields = [images, audio, ipa]
- API call only generates images, audio, ipa

---

### 4. AIGenerationResponse

Result from AI service, containing only non-skipped fields.

```
AIGenerationResponse {
  word: string
  generated: {
    meaning?: string
    ipa?: string
    example?: string
    imageUrls?: string[]        // URLs, not saved yet
    audioUrl?: string           // URL, not saved yet
  }
  skippedFields: string[]       // Fields that were skipped (for UI feedback)
  tokensCost: number            // Tokens used (for monitoring)
}
```

---

### 5. SkippedFieldFeedback

UI state for displaying skip badges and tooltips.

```
SkippedFieldFeedback {
  wordId: string
  skippedFields: {
    [fieldName: string]: {
      isSkipped: boolean
      reason: string            // "already filled manually"
    }
  }
  displayUntil?: timestamp      // When to remove feedback (optional)
}
```

---

## Field Completeness Rules

| Field | Empty Condition | Filled Condition | Type |
|-------|-----------------|------------------|------|
| meaning | Empty string or whitespace-only | Non-empty text | Text |
| ipa | Empty string or whitespace-only | Non-empty text | Text |
| example | Empty string or whitespace-only | Non-empty text | Text |
| images | No images or array is empty | Array contains ≥1 image | Attachment |
| audio | No audio file or file.size === 0 | Audio file attached, size > 0 | Attachment |

---

## Validation Rules

### Pre-Request Validation
- **FR-001**: System detects field state before triggering AI
  - Logic: For each field, check completeness condition above
  - Input: Word object with current metadata
  - Output: FieldState with filled/empty for each field

- **FR-002**: skipFields are excluded from AI request
  - Logic: All filled fields → skipFields
  - Output: AI request payload excludes skip fields

### Post-Response Validation
- **FR-005**: Existing user content never overwritten
  - Logic: Merge AI response with existing Word; preserve non-empty existing fields
  - Merge rule: If word.field has content, keep it; else use AI response.field

### Field Data Validation
- **Text fields** (meaning, ipa, example): No null bytes; max length 2000 chars
- **Attachment fields** (images, audio): Valid file references; files must exist in storage

---

## State Transitions & Scenarios

### Scenario 1: User Pre-fills Meaning, Requests AI

```
Initial State:
  meaning: "definition" (filled by user)
  ipa: "" (empty)
  example: "" (empty)
  images: [] (empty)
  audio: null (empty)

Action: User clicks AI wand

Detection:
  skipFields = [meaning]
  requestedFields = [ipa, example, images, audio]

AI Call:
  Request sent with skipFields excluded
  Response: { ipa: "...", example: "...", images: [...], audio: "..." }

Merge:
  meaning: "definition" (preserved, not overwritten)
  + AI results for ipa, example, images, audio

Result:
  All fields filled; skip badge shown on meaning field
```

### Scenario 2: User Pre-fills All Fields, Requests AI

```
Initial State:
  All fields filled

Detection:
  skipFields = [meaning, ipa, example, images, audio]
  requestedFields = []

AI Call:
  No API call made (nothing to request)

Result:
  No changes; no skip badges shown (all fields already present)
```

### Scenario 3: User Clears Meaning, Requests AI Again

```
Previous State:
  meaning: "definition" (filled)
  ipa: "..." (filled by AI)
  ...

Action: User deletes meaning text

New State:
  meaning: "" (now empty)

Detection:
  skipFields = [ipa, ...] (meaning is now empty, not skipped)
  requestedFields = [meaning, ...]

Result:
  AI generates new meaning; ipa preserved
```

---

## Relationships & Dependencies

- **Word ↔ FieldState**: One-to-one; FieldState derived from Word fields
- **AIGenerationRequest ↔ FieldState**: Skip logic based on FieldState
- **AIGenerationResponse ↔ Word**: Merge response into Word (preserve non-empty existing fields)
- **SkippedFieldFeedback ↔ Word**: UI feedback tied to Word; shown in editor UI

---

## Storage & Persistence

All Word metadata is persisted in SQLite (locally).

```sql
words (
  id TEXT PRIMARY KEY,
  levelId TEXT REFERENCES levels(id),
  word TEXT NOT NULL,
  meaning TEXT,
  ipa TEXT,
  example TEXT,
  imageIds JSON,           -- Stored as JSON array
  audioId TEXT,
  updatedAt TIMESTAMP
)
```

Image and audio files stored in file system with content-addressed paths.

---

## Summary

This data model ensures:
1. **Correctness**: Field states accurately reflect user intent (filled vs. empty)
2. **Safety**: User data never overwritten by AI
3. **Efficiency**: Skip logic prevents wasted API calls on pre-filled fields
4. **Traceability**: Response includes skipped fields for UI feedback

