import { useMemo } from "react";
import { sampleCourses } from "../data/sampleCourses";
import { sampleLevels } from "../data/sampleLevels";
import { countsFromLevels } from "../model/counts";
import type { Course, CourseEdit, CourseLevel } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

/** Sample and created courses with the learner's edits and counts derived from their levels. */
export function mergeCourses(
  createdCourses: Course[],
  courseEdits: Record<string, CourseEdit>,
  courseLevels: Record<string, CourseLevel[]>,
): Course[] {
  return [
    ...sampleCourses.map((course) => ({ ...course, ...courseEdits[course.id] })),
    ...createdCourses,
  ].map((course) => ({
    ...course,
    ...countsFromLevels(
      courseLevels[course.id] ?? sampleLevels[course.id] ?? [],
      course.itemsDue,
    ),
  }));
}

export function useAllCourses(): Course[] {
  const createdCourses = useLearnerStore((state) => state.createdCourses);
  const courseEdits = useLearnerStore((state) => state.courseEdits);
  const courseLevels = useLearnerStore((state) => state.courseLevels);
  return useMemo(
    () => mergeCourses(createdCourses, courseEdits, courseLevels),
    [courseEdits, createdCourses, courseLevels],
  );
}

/** Courses currently shown to the learner, read outside React. */
export function getVisibleCourses(): Course[] {
  const { createdCourses, courseEdits, courseLevels, removedCourseIds } =
    useLearnerStore.getState();
  return mergeCourses(createdCourses, courseEdits, courseLevels).filter(
    (course) => !removedCourseIds.includes(course.id),
  );
}

export function useCourse(id: string): Course | undefined {
  const courses = useAllCourses();
  return courses.find((course) => course.id === id);
}
