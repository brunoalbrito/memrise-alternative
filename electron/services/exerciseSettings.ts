import { z } from "zod";
import { EXERCISE_KINDS, ExerciseKindSchema, type ExerciseKind } from "../shared/exercises";
import type { Settings } from "./settings";

const KEY = "practice.disabledExercises";

export const SetExercisesSchema = z.object({ enabled: z.array(ExerciseKindSchema).min(1).max(EXERCISE_KINDS.length) });

export class ExerciseSettingsError extends Error {
  readonly code = "validation_failed";
  constructor(message: string) {
    super(message);
    this.name = "ExerciseSettingsError";
  }
}

/** Which exercise types are turned on. Stored as the list of kinds turned off, so a new kind is on by default. */
export function getEnabledExercises(settings: Settings): ExerciseKind[] {
  let disabled: string[] = [];
  try {
    const parsed: unknown = JSON.parse(settings.get(KEY) ?? "[]");
    if (Array.isArray(parsed)) disabled = parsed.filter((k): k is string => typeof k === "string");
  } catch {
    disabled = [];
  }
  const enabled = EXERCISE_KINDS.filter((k) => !disabled.includes(k));
  return enabled.length > 0 ? enabled : [...EXERCISE_KINDS];
}

export function setEnabledExercises(settings: Settings, enabled: ExerciseKind[]): void {
  const on = new Set(enabled);
  if (on.size === 0) throw new ExerciseSettingsError("Keep at least one exercise type on.");
  settings.set(KEY, JSON.stringify(EXERCISE_KINDS.filter((k) => !on.has(k))));
}
