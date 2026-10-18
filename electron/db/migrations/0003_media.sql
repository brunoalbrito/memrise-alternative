-- Files stored on disk as media/<sha256>.<ext>. `id` is the reference used by words; ids with the same content share one file.
CREATE TABLE media (
  id            TEXT PRIMARY KEY,
  hash          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('images', 'audio')),
  content_type  TEXT NOT NULL,
  ext           TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  created_at    TEXT NOT NULL
) STRICT;
CREATE INDEX media_hash ON media (hash);
