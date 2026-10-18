-- Spaced-repetition state of each word (FSRS). A word without a row is new. Word ids are plain text: words may belong to built-in sample courses.
CREATE TABLE cards (
  word_id        TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL,
  state          INTEGER NOT NULL DEFAULT 0,  -- 0 new, 1 learning, 2 review, 3 relearning
  due_at         TEXT NOT NULL,
  stability      REAL NOT NULL DEFAULT 0,
  difficulty     REAL NOT NULL DEFAULT 0,
  elapsed_days   INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  learning_steps INTEGER NOT NULL DEFAULT 0,
  reps           INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  last_review_at TEXT,
  learned_at     TEXT,
  ignored        INTEGER NOT NULL DEFAULT 0,
  in_long_term   INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
) STRICT;
CREATE INDEX cards_course_due ON cards (course_id, due_at);

ALTER TABLE course_settings ADD COLUMN new_per_day INTEGER NOT NULL DEFAULT 10;
