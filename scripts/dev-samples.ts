import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSampleLibrary } from "./make-sample-library.ts";

/**
 * Starts the development app with the sample course loaded into its own data folder (MemBetter-dev) when that library is empty.
 * The installed app never sees this data: it keeps its library in a different folder and ignores the sample file.
 */
const file = resolve("dev-data/sample-courses.membetter");
mkdirSync(resolve("dev-data"), { recursive: true });
writeFileSync(file, buildSampleLibrary());
console.log("Starting MemBetter with sample data (folder MemBetter-dev). Use `pnpm dev:reset` to empty it.");
const child = spawn("pnpm", ["exec", "electron-vite", "dev"], { stdio: "inherit", env: { ...process.env, MEMBETTER_SEED_FILE: file } });
child.on("exit", (code) => process.exit(code ?? 0));
