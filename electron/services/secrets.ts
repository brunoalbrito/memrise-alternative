import type { Settings } from "./settings";

export type Provider = "google" | "pollinations";

/** Encrypts with the operating system's protected storage (Electron `safeStorage` in the app). */
export interface Cipher {
  available(): boolean;
  /** True when the operating system only offers weak protection (for example no keyring on Linux). */
  weak(): boolean;
  encrypt(plain: string): Uint8Array;
  decrypt(data: Uint8Array): string;
}

export class SecretsUnavailableError extends Error {
  readonly code = "secret_unavailable";
  constructor() {
    super("Secure storage is not available on this computer, so the key cannot be saved safely.");
    this.name = "SecretsUnavailableError";
  }
}

export interface SecretStatus {
  connected: boolean;
  /** Last four characters only, for display. */
  last4: string;
}

const enc = (p: Provider) => `ai.${p}Key.enc`;
const last4Key = (p: Provider) => `ai.${p}Key.last4`;

/** Keys are write-only: callers can save, remove, ask for a status, or (inside the main process only) read for one call. */
export class Secrets {
  constructor(
    private readonly settings: Settings,
    private readonly cipher: Cipher,
  ) {}

  save(provider: Provider, key: string): void {
    if (!this.cipher.available()) throw new SecretsUnavailableError();
    const encrypted = Buffer.from(this.cipher.encrypt(key)).toString("base64");
    this.settings.set(enc(provider), encrypted);
    this.settings.set(last4Key(provider), key.slice(-4));
  }

  remove(provider: Provider): void {
    this.settings.delete(enc(provider));
    this.settings.delete(last4Key(provider));
  }

  status(provider: Provider): SecretStatus {
    return { connected: this.settings.get(enc(provider)) !== null, last4: this.settings.get(last4Key(provider)) ?? "" };
  }

  weakProtection(): boolean {
    return this.cipher.available() && this.cipher.weak();
  }

  /** Decrypted key for a single provider call. Never return this to the renderer or log it. */
  reveal(provider: Provider): string | null {
    const stored = this.settings.get(enc(provider));
    if (stored === null) return null;
    try {
      return this.cipher.decrypt(Uint8Array.from(Buffer.from(stored, "base64")));
    } catch {
      // The operating system could not decrypt it (for example a different user account): treat as not connected.
      return null;
    }
  }
}
