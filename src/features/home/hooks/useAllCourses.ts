import { useMemo } from "react";
import { sampleCourses } from "../data/sampleCourses";
import type { Course } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

export function useAllCourses(): Course[] {
  const createdCourses = useLearnerStore((state) => state.createdCourses);
  const courseEdits = useLearnerStore((state) => state.courseEdits);
  return useMemo(
    () => [
      ...sampleCourses.map((course) => ({ ...course, ...courseEdits[course.id] })),
      ...createdCourses,
    ],
    [courseEdits, createdCourses],
  );
}

export function useCourse(id: string): Course | undefined {
  const courses = useAllCourses();
  return courses.find((course) => course.id === id);
}
