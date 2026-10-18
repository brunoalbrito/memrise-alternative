import { useMemo } from "react";
import { overlayLearned } from "../model/progress";
import type { CourseLevel } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";
import { useProgressStore } from "../store/progressStore";

const NONE: CourseLevel[] = [];

/**
 * Levels of a course for display: the learner's levels, or none.
 * In the desktop app each word's `learned` flag reflects real practice.
 */
export function useCourseLevels(courseId: string): CourseLevel[] {
  const stored = useLearnerStore((state) => state.courseLevels[courseId]);
  const loaded = useProgressStore((state) => state.loaded);
  const cards = useProgressStore((state) => state.cards);
  const base = stored ?? NONE;
  return useMemo(() => (loaded ? overlayLearned(base, cards) : base), [base, loaded, cards]);
}

/** Current stored levels of a course, read outside React (for saving and exporting). Never includes progress. */
export function getCourseLevels(courseId: string): CourseLevel[] {
  return useLearnerStore.getState().courseLevels[courseId] ?? NONE;
}
