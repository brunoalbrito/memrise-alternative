-- API configuration for image generation providers (Google Gemini, etc).
CREATE TABLE ai_provider_configs (
  id INTEGER PRIMARY KEY,
  provider_id TEXT UNIQUE NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  last_4 TEXT NOT NULL,
  model_name TEXT,
  connected INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
) STRICT;
