# Contract: `.membetter` course file (format version 1)

A standard ZIP archive (deflate; media may be stored uncompressed). File extension `.membetter`, MIME type
`application/vnd.membetter.course+zip`.

```text
course.membetter
├── manifest.json
├── course.json
├── progress.json            (optional)
└── media/<sha256>.<ext>     (zero or more)
```

A library file (`library.membetter`) has the same `manifest.json` with `kind: "library"` and one folder per course:
`courses/<courseId>/course.json`, `courses/<courseId>/progress.json`, plus a shared top-level `media/`.

## manifest.json
```json
{
  "format": "membetter-course",
  "formatVersion": 1,
  "kind": "course",
  "appVersion": "1.0.0",
  "exportedAt": "2026-10-18T12:00:00Z",
  "courseId": "uuid",
  "counts": { "levels": 3, "words": 120, "media": 85 },
  "includesProgress": false
}
```

## course.json
```json
{
  "id": "uuid",
  "title": "string",
  "teachingLanguageId": "en-gb",
  "speakersLanguageId": "pt-br",
  "categoryId": "lang-en-gb",
  "tags": ["string"],
  "description": "string|null",
  "shortDescription": "string|null",
  "coverMedia": "sha256|null",
  "settings": { "accentTolerant": false, "newPerDay": 10 },
  "levels": [
    {
      "id": "uuid", "name": "string", "tested": "string",
      "words": [
        { "id": "uuid", "text": "string", "meaning": "string", "example": "string", "ipa": "string",
          "images": ["sha256"], "audio": ["sha256"] }
      ]
    }
  ]
}
```
Order of arrays is the order of positions. Personal settings that belong to the user, not to the course content (daily goal,
hidden state) are not exported.

## progress.json (only when included)
```json
{ "cards": [ { "wordId": "uuid", "state": "review", "dueAt": "ISO", "stability": 1.0, "difficulty": 5.0,
               "reps": 3, "lapses": 0, "lastReviewAt": "ISO", "learnedAt": "ISO", "ignored": false, "inLongTerm": false } ],
  "reviews": [ { "wordId": "uuid", "rating": 3, "result": "correct", "hintsUsed": 0, "reviewedAt": "ISO" } ] }
```

## Import rules
1. Open the archive without extracting to disk; enforce limits: at most 10,000 entries, 50 MB per entry, 2 GB total
   uncompressed, compression ratio at most 100:1.
2. Allowed entry names: `manifest.json`, `course.json`, `progress.json`, `media/<64 hex>.<ext>` (and the `courses/<id>/...`
   equivalents for libraries). Anything else, any `..`, absolute path, backslash or duplicate name rejects the whole file.
3. `format` must be `membetter-course`; `formatVersion` greater than the app supports gives the error
   `unsupported_format` with "update the app"; older versions run migration functions in order.
4. `course.json` and `progress.json` are parsed with zod; ids must be UUIDs; limits from the data model apply; every media
   hash referenced must exist in `media/` and its SHA-256, content type (magic bytes) and size must match.
5. Conflict: if a course with the same `id` exists, the user chooses `replace` (existing course content and its progress for
   removed words are replaced; progress for kept words is kept unless the file includes progress), `copy` (all ids regenerated,
   title gets " (copy)"), or `cancel`.
6. Everything is staged in a temp folder, then written in one transaction; media files are moved into the library only after
   the commit succeeds; any failure removes the temp data and leaves the library untouched.
7. Imported progress is only applied when the user confirms "Import progress" and only for words present in the course.

## Export rules
- Streamed to the target file via a temporary name and renamed on success.
- Media written once even when used by several words.
- AI keys, settings, backup folder, and other library data are never included.
