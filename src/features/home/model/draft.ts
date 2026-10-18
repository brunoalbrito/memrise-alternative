import { DEFAULT_SPEAKERS_LANGUAGE_ID } from "../data/languages";
import type { Course, CourseDraft } from "./types";

/** Form values for editing a course. */
export function draftFromCourse(course: Course): CourseDraft {
  return {
    name: course.title,
    teachingLanguageId: course.teachingLanguageId ?? "",
    speakersLanguageId: course.speakersLanguageId ?? DEFAULT_SPEAKERS_LANGUAGE_ID,
    tagsInput: course.tags?.join(", ") ?? "",
    description: course.description ?? "",
    shortDescription: course.shortDescription ?? "",
  };
}
