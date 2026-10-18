import {
  getCategoryById,
  percentLearned,
  progressCounts,
  useProgressStore,
  useCourse,
  useCourseLevels,
  useLearnerStore,
} from "../../home";
import { categoryPath } from "../model/breadcrumb";
import { levelViews } from "../model/levels";

export function useCourseDetail(id: string) {
  const course = useCourse(id);
  const removed = useLearnerStore((state) => state.removedCourseIds);
  const goal = useLearnerStore((state) => (course ? state.goals[course.id] : undefined));
  const storedLevels = useCourseLevels(id);
  const loaded = useProgressStore((state) => state.loaded);
  const cards = useProgressStore((state) => state.cards);
  const asOf = useProgressStore((state) => state.asOf);

  if (!course || removed.includes(course.id)) return null;

  const counts = loaded ? progressCounts(storedLevels, cards, asOf) : null;

  return {
    course,
    creator: "You",
    symbol: getCategoryById(course.categoryId)?.icon ?? "📚",
    path: categoryPath(course),
    percent: percentLearned(course),
    longTermCount: counts ? counts.longTerm : 0,
    ignoredCount: counts ? counts.ignored : 0,
    dueCount: course.itemsDue,
    levels: levelViews(storedLevels),
    goal,
  };
}
