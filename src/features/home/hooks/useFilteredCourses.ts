import { useMemo } from "react";
import { allCategories, getCategoryById } from "../data/sampleCourses";
import { applyFilter, availableCategories, visibleCourses } from "../model/selectors";
import type { FilterValue } from "../model/types";
import { useLearnerStore } from "../store/learnerStore";
import { useAllCourses } from "./useAllCourses";
import { useFilterParam } from "./useFilterParam";

function filterName(filter: FilterValue): string {
  if (filter === "goal") return "With Goal Set";
  if (filter === "teaching") return "Teaching";
  if (filter.startsWith("cat:")) {
    return getCategoryById(filter.slice(4))?.name ?? "All Courses";
  }
  return "All Courses";
}

export function useFilteredCourses() {
  const allCourses = useAllCourses();
  const goals = useLearnerStore((state) => state.goals);
  const removedCourseIds = useLearnerStore((state) => state.removedCourseIds);
  const [rawFilter, setFilter] = useFilterParam();

  return useMemo(() => {
    const visible = visibleCourses(allCourses, removedCourseIds);
    const categories = availableCategories(visible, allCategories);
    // A category filter whose category has no visible courses falls back to all.
    const filter: FilterValue =
      rawFilter.startsWith("cat:") &&
      !categories.some((c) => `cat:${c.id}` === rawFilter)
        ? "all"
        : rawFilter;
    return {
      hasCourses: visible.length > 0,
      courses: applyFilter(visible, goals, filter),
      categories,
      filter,
      filterName: filterName(filter),
      setFilter,
      goals,
    };
  }, [allCourses, goals, removedCourseIds, rawFilter, setFilter]);
}
