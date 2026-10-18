import { ipcMain } from "electron";
import type { ZodType } from "zod";
import type { Result } from "../shared/api";

/** Registers a validated handler. Errors become `{ ok: false }`, never exceptions or stack traces. */
export function handle<I, O>(
  channel: string,
  schema: ZodType<I> | null,
  fn: (input: I) => O | Promise<O>,
): void {
  ipcMain.handle(channel, async (_event, raw: unknown): Promise<Result<O>> => {
    try {
      const input = schema ? schema.safeParse(raw) : { success: true as const, data: undefined as I };
      if (!input.success) {
        return { ok: false, error: { code: "validation_failed", message: input.error.issues[0]?.message ?? "Invalid input" } };
      }
      return { ok: true, data: await fn(input.data) };
    } catch (error) {
      if (error instanceof Error && (error.name === "MediaError" || error.name === "ExchangeError") && "code" in error && typeof (error as { code: unknown }).code === "string") {
        return { ok: false, error: { code: (error as { code: string }).code, message: error.message } };
      }
      console.error(`[ipc] ${channel} failed`, error);
      return { ok: false, error: { code: "internal", message: "Something went wrong. Your data was not changed." } };
    }
  });
}
