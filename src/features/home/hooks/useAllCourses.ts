import { useMemo } from "react";
import { sampleCourses } from "../data/sampleCourses";
import { sampleLevels } from "../data/sampleLevels";
import { countsFromLevels } from "../model/counts";
import type { Course } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

export function useAllCourses(): Course[] {
  const createdCourses = useLearnerStore((state) => state.createdCourses);
  const courseEdits = useLearnerStore((state) => state.courseEdits);
  const courseLevels = useLearnerStore((state) => state.courseLevels);
  return useMemo(
    () =>
      [
        ...sampleCourses.map((course) => ({ ...course, ...courseEdits[course.id] })),
        ...createdCourses,
      ].map((course) => ({
        ...course,
        ...countsFromLevels(
          courseLevels[course.id] ?? sampleLevels[course.id] ?? [],
          course.itemsDue,
        ),
      })),
    [courseEdits, createdCourses, courseLevels],
  );
}

export function useCourse(id: string): Course | undefined {
  const courses = useAllCourses();
  return courses.find((course) => course.id === id);
}
