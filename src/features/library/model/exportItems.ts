import type { ExportItem } from "../../../../electron/shared/schemas";
import { getCourseLevels, getVisibleCourses, type Course } from "../../home";

/** The data of one course as written to a `.membetter` file. */
export function exportItemFor(course: Course): ExportItem {
  return { course, levels: getCourseLevels(course.id) };
}

export function exportItemsForAll(): ExportItem[] {
  return getVisibleCourses().map(exportItemFor);
}
