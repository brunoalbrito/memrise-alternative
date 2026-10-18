import { useMemo } from "react";
import { sampleCourses } from "../data/sampleCourses";
import { sampleLevels } from "../data/sampleLevels";
import { countsFromLevels } from "../model/counts";
import { overlayLearned, progressCounts, type ProgressCards } from "../model/progress";
import type { Course, CourseEdit, CourseLevel } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";
import { useProgressStore } from "../store/progressStore";

export interface ProgressInput {
  cards: ProgressCards;
  practicedToday: Record<string, number>;
  asOf: number;
}

/**
 * Sample and created courses with the learner's edits and counts derived from their levels. With real progress
 * (desktop app), learned, due and "today" counts come from practice; otherwise the sample numbers are used.
 */
export function mergeCourses(
  createdCourses: Course[],
  courseEdits: Record<string, CourseEdit>,
  courseLevels: Record<string, CourseLevel[]>,
  progress: ProgressInput | null = null,
): Course[] {
  return [
    ...sampleCourses.map((course) => ({ ...course, ...courseEdits[course.id] })),
    ...createdCourses,
  ].map((course) => {
    const levels = courseLevels[course.id] ?? sampleLevels[course.id] ?? [];
    if (!progress) return { ...course, ...countsFromLevels(levels, course.itemsDue) };
    const withProgress = overlayLearned(levels, progress.cards);
    const { due } = progressCounts(withProgress, progress.cards, progress.asOf);
    return {
      ...course,
      ...countsFromLevels(withProgress, due),
      itemsDue: due,
      learnedToday: progress.practicedToday[course.id] ?? 0,
    };
  });
}

function useProgressInput(): ProgressInput | null {
  const loaded = useProgressStore((state) => state.loaded);
  const cards = useProgressStore((state) => state.cards);
  const practicedToday = useProgressStore((state) => state.practicedToday);
  const asOf = useProgressStore((state) => state.asOf);
  return useMemo(() => (loaded ? { cards, practicedToday, asOf } : null), [loaded, cards, practicedToday, asOf]);
}

export function useAllCourses(): Course[] {
  const createdCourses = useLearnerStore((state) => state.createdCourses);
  const courseEdits = useLearnerStore((state) => state.courseEdits);
  const courseLevels = useLearnerStore((state) => state.courseLevels);
  const progress = useProgressInput();
  return useMemo(
    () => mergeCourses(createdCourses, courseEdits, courseLevels, progress),
    [courseEdits, createdCourses, courseLevels, progress],
  );
}

/** Courses currently shown to the learner, read outside React. */
export function getVisibleCourses(): Course[] {
  const { createdCourses, courseEdits, courseLevels, removedCourseIds } =
    useLearnerStore.getState();
  const p = useProgressStore.getState();
  return mergeCourses(
    createdCourses,
    courseEdits,
    courseLevels,
    p.loaded ? { cards: p.cards, practicedToday: p.practicedToday, asOf: p.asOf } : null,
  ).filter((course) => !removedCourseIds.includes(course.id));
}

export function useCourse(id: string): Course | undefined {
  const courses = useAllCourses();
  return courses.find((course) => course.id === id);
}
