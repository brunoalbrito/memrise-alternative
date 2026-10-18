import { sampleLevels } from "../data/sampleLevels";
import type { CourseLevel } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

const NONE: CourseLevel[] = [];

/** Levels of a course: the learner's version, else the built-in sample levels, else none. */
export function useCourseLevels(courseId: string): CourseLevel[] {
  const stored = useLearnerStore((state) => state.courseLevels[courseId]);
  return stored ?? sampleLevels[courseId] ?? NONE;
}

/** Current levels of a course, read outside React (for event handlers and async code). */
export function getCourseLevels(courseId: string): CourseLevel[] {
  return useLearnerStore.getState().courseLevels[courseId] ?? sampleLevels[courseId] ?? NONE;
}
