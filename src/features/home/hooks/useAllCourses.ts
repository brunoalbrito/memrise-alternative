import { useMemo } from "react";
import { sampleCourses } from "../data/sampleCourses";
import type { Course } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";

export function useAllCourses(): Course[] {
  const createdCourses = useLearnerStore((state) => state.createdCourses);
  return useMemo(() => [...sampleCourses, ...createdCourses], [createdCourses]);
}

export function useCourse(id: string): Course | undefined {
  const courses = useAllCourses();
  return courses.find((course) => course.id === id);
}
