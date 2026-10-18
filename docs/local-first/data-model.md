# Data Model: Local-First Desktop App

SQLite, one file. Ids are UUID v4 strings so exported courses never collide. Timestamps are ISO-8601 UTC text. Foreign keys
are enforced; soft delete is used only where noted. Migrations: `0001_init.sql` (content), `0002_study.sql` (study and logs),
`0003_backup_settings.sql`.

## Content

**courses**
| Column | Type | Rules |
|--------|------|-------|
| id | text pk | |
| title | text not null | 3 to 100 chars |
| teaching_language_id, speakers_language_id | text not null | ids from the static language list |
| category_id | text not null | defaults to `lang-<teaching>`; changes only when teaching language changes |
| tags | text (JSON array) | at most 10, each at most 30 chars |
| description | text null | at most 2000 chars |
| short_description | text null | at most 100 chars |
| cover_media_hash | text null fk media | |
| created_at, updated_at | text | |
| deleted_at | text null | soft delete (kept until "Empty trash" or 30 days) |

**levels**: `id`, `course_id` fk cascade, `position` int, `name`, `tested` text; unique (`course_id`, `position`).

**words**: `id`, `level_id` fk cascade, `position` int, `text` not null non-empty, `meaning`, `example`, `ipa`, `created_at`,
`updated_at`; unique (`level_id`, `position`).

**media**: `hash` text pk (SHA-256 hex), `kind` image|audio, `content_type`, `size_bytes`, `original_name`, `created_at`.
Limits: images 2 MB, audio 3 MB at import time.

**word_media**: (`word_id` fk cascade, `media_hash` fk, `kind`, `position`); at most 5 rows per (`word_id`, `kind`),
enforced in the service and by a trigger. Media rows with no reference in `word_media` or `courses.cover_media_hash` are
garbage-collected (file and row).

## Study

**course_settings**: `course_id` pk fk cascade, `daily_goal` (5, 10, 20, 50 or null), `hidden_at` null, `new_per_day` default 10,
`accent_tolerant` default 0, `desired_retention` default 0.9.

**cards**: `word_id` pk fk cascade; FSRS state: `state` (new, learning, review, relearning), `due_at`, `stability`, `difficulty`,
`reps`, `lapses`, `last_review_at`, `learned_at` null, `ignored` bool, `in_long_term` bool. A card row is created when the
word is first introduced (Learn), so "new" words are words without a card.

**review_log**: `id`, `word_id` fk cascade, `session_id` fk, `rating` (1 again, 2 hard, 3 good, 4 easy), `result`
(correct|hinted|wrong|gave_up|timeout), `hints_used`, `attempts`, `elapsed_ms`, `points`, `reviewed_at`,
`scheduled_days`, `state_before`.

**sessions**: `id`, `course_id` fk, `kind` (learn|classic|speed), `started_at`, `ended_at` null, `word_count`, `correct_count`,
`hints_total`, `points_total`, `status` (open|completed|abandoned). An open session found at startup is marked abandoned,
and its answered words stay recorded.

## Library

**settings**: `key` text pk, `value` text (JSON). Keys: `language`, `theme`, `ai.googleTextModel`, `ai.googleSpeechModel`,
`ai.pollinationsModel`, `ai.googleKey.enc`, `ai.pollinationsKey.enc` (ciphertext only), `backup.folder`, `backup.intervalDays`,
`backup.retention`, `backup.lastAt`, `shortcuts.visible`, `prototypeImport.done` (list of imported course ids).

**import_log**: `id`, `imported_at`, `source` (file name), `course_id`, `mode` (replace|copy|new), `counts` JSON; used for
support and to answer "was this already imported?".

Static data (not tables): languages and categories lists, the sample courses (an optional "Install sample courses" action).

## Derived values (views)

- `v_course_progress(course_id)`: `total` (words with non-empty text), `learned` (cards with `learned_at`), `due`
  (cards with `due_at <= now` and not ignored), `ignored`, `long_term`. Replaces the invented counts in sample data.
- `v_level_progress(level_id)`: same counts per level for the level cards.
- `v_daily_stats(day)`: reviews, correct, points per local day; streak computed from consecutive days with at least one review.

## State transitions

- **Card**: no row (new) -> learning -> review; wrong answer in review -> relearning -> review; ignored cards keep their state
  but are excluded from sessions; long-term marks cards excluded from classic review until manually reset.
- **Session**: open -> completed (all words answered, or user ends after confirmation) | abandoned (app closed or crashed).
- **Import**: parsed -> validated -> staged (temp folder) -> committed (transaction) -> media moved; failure at any step
  leaves the library unchanged.
- **Course**: active -> hidden (setting) | soft-deleted -> purged.

## Validation rules (shared by renderer and main via zod)

Same limits as the prototype (title 3 to 100, tags at most 10 of at most 30 chars, descriptions at most 2000 and 100 chars,
5 images and 5 audio per word, image 2 MB, audio 3 MB). Word text is required. Allowed image types: PNG, JPEG, GIF, WebP; audio:
MP3, WAV, OGG, M4A; content is sniffed by magic bytes, not by declared type or extension.
