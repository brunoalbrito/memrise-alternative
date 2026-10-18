import { rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Where Electron keeps per-user app data on this operating system. */
function appData(): string {
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support");
  if (process.platform === "win32") return process.env["APPDATA"] ?? join(homedir(), "AppData", "Roaming");
  return process.env["XDG_CONFIG_HOME"] ?? join(homedir(), ".config");
}

// Only the folder used by `pnpm dev` is removed, never an installed app's data.
const folder = join(appData(), "MemBetter-dev");
rmSync(folder, { recursive: true, force: true });
console.log(`Removed ${folder}. The next \`pnpm dev\` starts with an empty library.`);
