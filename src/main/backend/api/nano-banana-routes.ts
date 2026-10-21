import { encryptKey, getKeyLast4 } from "../utils/encryption";

export interface AiConfig {
  nanoBananaConnected: boolean;
  nanoBananaLast4: string;
  nanoBananaModel: string;
}


/**
 * Get current AI provider configuration (status).
 * Returns connected state and masked keys (last 4 chars only).
 */
export function getAiConfig(db: any): {
  nanoBanana: {
    connected: boolean;
    last4: string;
  };
  models: {
    nanoBananaModel: string;
  };
} {
  const stmt = db.prepare("SELECT * FROM ai_provider_configs WHERE provider_id = ?");
  const config = stmt.get("nanoBanana");

  if (!config) {
    return {
      nanoBanana: {
        connected: false,
        last4: "",
      },
      models: {
        nanoBananaModel: "",
      },
    };
  }

  return {
    nanoBanana: {
      connected: config.connected === 1,
      last4: config.last_4,
    },
    models: {
      nanoBananaModel: config.model_name || "",
    },
  };
}

/**
 * Save API key to encrypted storage (Nano Banana provider).
 * Validates non-empty, no whitespace.
 */
export function saveNanoBananaKey(db: any, key: string): {
  success: boolean;
  error?: string;
  last4?: string;
} {
  // Validation per spec contract: "Enter your API key without spaces."
  if (!key || key.trim() === "") {
    return {
      success: false,
      error: "Enter your API key without spaces.",
    };
  }

  if (key !== key.trim() || key.includes(" ")) {
    return {
      success: false,
      error: "Enter your API key without spaces.",
    };
  }

  try {
    const last4 = getKeyLast4(key);
    const encryptedKey = encryptKey(key);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO ai_provider_configs
      (provider_id, api_key_encrypted, last_4, model_name, connected, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider_id) DO UPDATE SET
        api_key_encrypted = excluded.api_key_encrypted,
        last_4 = excluded.last_4,
        connected = excluded.connected,
        updated_at = excluded.updated_at
    `);

    stmt.run("nanoBanana", encryptedKey, last4, "", 1, now, now);

    console.log("[AI] Nano Banana key saved", { last4 });

    return {
      success: true,
      last4,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI] Failed to save Nano Banana key", { message });
    return {
      success: false,
      error: "Failed to save key. Please try again.",
    };
  }
}

/**
 * Remove Nano Banana API key from storage.
 */
export function removeNanoBananaKey(db: any): { success: boolean; error?: string } {
  try {
    const stmt = db.prepare("DELETE FROM ai_provider_configs WHERE provider_id = ?");
    stmt.run("nanoBanana");

    console.log("[AI] Nano Banana key removed");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[AI] Failed to remove Nano Banana key", { message });
    return {
      success: false,
      error: "Failed to remove key.",
    };
  }
}


/**
 * Detect and clear old Pollinations configuration on migration.
 */
export function migrateFromPollinations(db: any): void {
  try {
    const pollConfig = db.prepare("SELECT * FROM ai_provider_configs WHERE provider_id = ?").get("pollinations");

    if (pollConfig) {
      console.log("[AI] Clearing old Pollinations configuration");
      db.prepare("DELETE FROM ai_provider_configs WHERE provider_id = ?").run("pollinations");
    }
  } catch (err) {
    console.warn("[AI] Could not check for Pollinations config during migration");
  }
}
