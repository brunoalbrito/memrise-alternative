-- Library-wide key/value settings (language, theme, backup config, ...).
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;
