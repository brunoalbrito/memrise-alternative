import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { expect } from "@playwright/test";
import { cleanup, type Launched } from "../launch";

export const SAMPLER = "custom-sample-pictures-and-sounds";
export const SAMPLER_WORDS = ["cat", "dog", "bird", "fish", "horse", "mouse", "table", "chair", "window", "door", "lamp", "clock"];

type Api = { library: { load(): Promise<{ data: { courseLevels: Record<string, { words: { id: string }[] }[]> } }> }; study: { setExerciseSettings(k: string[]): Promise<unknown>; startSession(c: string, k: string, n: number): Promise<{ data: string }>; answer(s: string, o: unknown): Promise<unknown>; endSession(s: string, st: string): Promise<unknown> } };

/** Imports the development sample library (with pictures and recordings) through the Import button, like a learner would. */
export async function importSamples(app: Launched): Promise<void> {
  const out = mkdtempSync(join(tmpdir(), "membetter-samples-e2e-"));
  const file = join(out, "sample-courses.membetter");
  execFileSync("node", ["scripts/make-sample-library.ts", file], { stdio: "pipe" });
  await app.app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths: [path] })) as unknown as typeof dialog.showOpenDialog;
  }, file);
  await app.page.getByRole("button", { name: "Import", exact: true }).click();
  await app.page.getByRole("button", { name: "Import", exact: true }).last().click();
  await expect(app.page.getByText(/Imported \d+ courses?\./)).toBeVisible();
  cleanup(out);
}

export const only = (page: Launched["page"], kinds: string[]) => page.evaluate((k) => (window as unknown as { api: Api }).api.study.setExerciseSettings(k), kinds);
export const go = (page: Launched["page"], hash: string) => page.evaluate((h) => void (location.hash = h), hash);

/** Learns every word of the course once so each one has a card. Close the app, then call `makeDue`. */
export async function learnAll(page: Launched["page"], courseId: string): Promise<void> {
  await page.evaluate(
    async ({ courseId }) => {
      const api = (window as unknown as { api: Api }).api;
      const wordIds = (await api.library.load()).data.courseLevels[courseId]!.flatMap((l) => l.words.map((w) => w.id));
      const session = (await api.study.startSession(courseId, "learn", wordIds.length)).data;
      for (const wordId of wordIds) await api.study.answer(session, { wordId, result: "correct", hintsUsed: 0, attempts: 0, elapsedMs: 4000, points: 10, exercise: "type" });
      await api.study.endSession(session, "completed");
    },
    { courseId },
  );
}

export function makeDue(userData: string): void {
  const db = new Database(join(userData, "library", "membetter.db"));
  db.prepare("UPDATE cards SET due_at = '2020-01-01T00:00:00.000Z'").run();
  db.close();
}

export function reviewLog(userData: string, kind?: string): { exercise: string; result: string; attempts: number; points: number }[] {
  const db = new Database(join(userData, "library", "membetter.db"), { readonly: true });
  const sql = `SELECT exercise, result, attempts, points FROM review_log ${kind ? "WHERE session_id IN (SELECT id FROM sessions WHERE kind = ?)" : ""} ORDER BY id`;
  const rows = (kind ? db.prepare(sql).all(kind) : db.prepare(sql).all()) as { exercise: string; result: string; attempts: number; points: number }[];
  db.close();
  return rows;
}
