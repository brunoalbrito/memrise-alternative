import type {
  Category,
  Course,
  FilterValue,
  GoalValue,
  PrimaryAction,
} from "./types";

export function percentLearned(course: Course): number {
  if (course.totalItems === 0) return 0;
  if (course.itemsLearned >= course.totalItems) return 100;
  return Math.min(
    99,
    Math.floor((course.itemsLearned / course.totalItems) * 100),
  );
}

export function primaryAction(course: Course): PrimaryAction {
  return course.itemsDue > 0 ? "speed-review" : "learn-new-words";
}

export function goalProgress(
  course: Course,
  goal: GoalValue | undefined,
): number | undefined {
  if (goal === undefined) return undefined;
  return Math.min(course.learnedToday / goal, 1);
}

export function visibleCourses(
  courses: Course[],
  removedIds: string[],
): Course[] {
  return courses.filter((course) => !removedIds.includes(course.id));
}

export function applyFilter(
  courses: Course[],
  goals: Record<string, GoalValue>,
  filter: FilterValue,
): Course[] {
  if (filter === "goal") return courses.filter((c) => goals[c.id] !== undefined);
  if (filter === "teaching") return courses.filter((c) => c.teaching);
  if (filter.startsWith("cat:")) {
    const categoryId = filter.slice(4);
    return courses.filter((c) => c.categoryId === categoryId);
  }
  return courses;
}

export function availableCategories(
  courses: Course[],
  categories: Category[],
): Category[] {
  return categories.filter((category) =>
    courses.some((course) => course.categoryId === category.id),
  );
}
