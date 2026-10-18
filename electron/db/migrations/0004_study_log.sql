-- One row per practice session and one per answer. Word ids are plain text: words may belong to built-in sample courses.
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('learn', 'classic', 'speed')),
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  word_count    INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  hints_total   INTEGER NOT NULL DEFAULT 0,
  points_total  INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'abandoned'))
) STRICT;
CREATE INDEX sessions_course ON sessions (course_id, started_at);

CREATE TABLE review_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  course_id   TEXT NOT NULL,
  word_id     TEXT NOT NULL,
  result      TEXT NOT NULL CHECK (result IN ('correct', 'hinted', 'wrong', 'gave_up', 'timeout')),
  hints_used  INTEGER NOT NULL,
  attempts    INTEGER NOT NULL,
  elapsed_ms  INTEGER NOT NULL,
  points      INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL
) STRICT;
CREATE INDEX review_log_word ON review_log (word_id, reviewed_at);
CREATE INDEX review_log_course ON review_log (course_id, reviewed_at);
