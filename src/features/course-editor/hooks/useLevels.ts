import { getCourseLevels, useCourseLevels, useLearnerStore, type CourseLevel } from "../../home";

/**
 * Levels of a course plus `apply`, which reads the latest levels, computes the next list and
 * saves it. Returns false when saving failed.
 */
export function useLevels(courseId: string) {
  const levels = useCourseLevels(courseId);

  const apply = (change: (current: CourseLevel[]) => CourseLevel[]): boolean => {
    try {
      useLearnerStore
        .getState()
        .setCourseLevels(courseId, change(getCourseLevels(courseId)));
      return true;
    } catch {
      return false;
    }
  };

  return { levels, apply };
}
