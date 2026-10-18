import {
  getCategoryById,
  percentLearned,
  progressCounts,
  useProgressStore,
  useCourse,
  useCourseLevels,
  useLearnerStore,
} from "../../home";
import { defaultExtras, sampleCourseExtras } from "../data/sampleCourseExtras";
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
  const isOwn = course.id.startsWith("custom-");
  const extras = isOwn ? defaultExtras : (sampleCourseExtras[course.id] ?? defaultExtras);

  return {
    course,
    creator: extras.creator,
    symbol: getCategoryById(course.categoryId)?.icon ?? "📚",
    path: categoryPath(course),
    percent: percentLearned(course),
    longTermCount: counts ? counts.longTerm : extras.longTermCount,
    ignoredCount: counts ? counts.ignored : extras.ignoredCount,
    dueCount: course.itemsDue,
    levels: levelViews(storedLevels),
    goal,
  };
}
