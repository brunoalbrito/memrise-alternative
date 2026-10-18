-- Courses created by the learner (sample courses live in the app and only store edits here).
CREATE TABLE courses (
  id                   TEXT PRIMARY KEY,
  title                TEXT NOT NULL,
  category_id          TEXT NOT NULL,
  cover_image          TEXT,
  teaching             INTEGER NOT NULL DEFAULT 1,
  total_items          INTEGER NOT NULL DEFAULT 0,
  items_learned        INTEGER NOT NULL DEFAULT 0,
  items_due            INTEGER NOT NULL DEFAULT 0,
  learned_today        INTEGER NOT NULL DEFAULT 0,
  teaching_language_id TEXT,
  speakers_language_id TEXT,
  tags                 TEXT,
  description          TEXT,
  short_description    TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  deleted_at           TEXT
) STRICT;

-- Learner's changes to a built-in sample course, applied over the sample data.
CREATE TABLE course_edits (
  course_id TEXT PRIMARY KEY,
  edit      TEXT NOT NULL
) STRICT;

-- Per-course learner settings: daily goal and "removed from Home".
CREATE TABLE course_settings (
  course_id  TEXT PRIMARY KEY,
  daily_goal INTEGER CHECK (daily_goal IN (5, 10, 20, 50)),
  hidden_at  TEXT
) STRICT;

-- Levels and words of any course (created or sample) the learner has edited.
CREATE TABLE levels (
  id        TEXT PRIMARY KEY,
  course_id TEXT NOT NULL,
  position  INTEGER NOT NULL,
  name      TEXT NOT NULL,
  tested    TEXT NOT NULL
) STRICT;
CREATE INDEX levels_course ON levels (course_id, position);

CREATE TABLE words (
  level_id TEXT NOT NULL REFERENCES levels (id) ON DELETE CASCADE,
  id       TEXT NOT NULL,
  position INTEGER NOT NULL,
  text     TEXT NOT NULL,
  meaning  TEXT NOT NULL,
  example  TEXT NOT NULL,
  ipa      TEXT,
  learned  INTEGER NOT NULL DEFAULT 0,
  images   TEXT NOT NULL DEFAULT '[]',
  audio    TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (level_id, id)
) STRICT;
