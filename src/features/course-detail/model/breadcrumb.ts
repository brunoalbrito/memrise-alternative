import { getCategoryById, type Course } from "../../home";

export interface Crumb {
  label: string;
  to?: string;
}

const LANGUAGE_CATEGORY_IDS = new Set(["english", "japanese", "spanish-mx"]);

export function categoryPath(course: Course): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Courses", to: "/courses" }];
  const category = getCategoryById(course.categoryId);
  if (!category) return crumbs;
  if (
    course.categoryId.startsWith("lang-") ||
    LANGUAGE_CATEGORY_IDS.has(course.categoryId)
  ) {
    crumbs.push({ label: "Languages", to: "/courses" });
  }
  crumbs.push({ label: category.name });
  return crumbs;
}
