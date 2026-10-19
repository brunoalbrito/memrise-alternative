/** Where the library lives: the installed app keeps your real data; development and samples use a separate folder. */
export interface DataProfile {
  /** `real`: the installed app. `sample`: `pnpm dev`, its own folder. `custom`: a folder given with --user-data-dir (tests). */
  kind: "real" | "sample" | "custom";
  /** Folder name inside the app-data folder for `sample`, otherwise null (Electron's default or the given folder). */
  folderName: string | null;
  /** A library file to load into an empty sample library, or null. Never set for the installed app. */
  seedFile: string | null;
  /** Replaces the app-data folder (tests only). Never set for the installed app. */
  appDataDir: string | null;
  /** Window title, with a mark when the data is not the real data. */
  title: string;
}

export const SAMPLE_FOLDER = "MemBetter-dev";

export function dataProfile(input: { isPackaged: boolean; argv: readonly string[]; env: Readonly<Record<string, string | undefined>> }): DataProfile {
  if (input.isPackaged) return { kind: "real", folderName: null, seedFile: null, appDataDir: null, title: "MemBetter" };
  const seedFile = input.env["MEMBETTER_SEED_FILE"] || null;
  const appDataDir = input.env["MEMBETTER_APP_DATA"] || null;
  if (input.argv.some((arg) => arg.startsWith("--user-data-dir"))) return { kind: "custom", folderName: null, seedFile, appDataDir, title: "MemBetter" };
  return { kind: "sample", folderName: SAMPLE_FOLDER, seedFile, appDataDir, title: "MemBetter (sample data)" };
}
