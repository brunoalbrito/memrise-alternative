import { parseTags, type CourseDraft } from "../../home";

export type FieldName =
  | "name"
  | "teachingLanguageId"
  | "tagsInput"
  | "description"
  | "shortDescription";

export type FormErrors = Partial<Record<FieldName, string>>;

/** Visual order of the fields, used to pick the first invalid one. */
export const FIELD_ORDER: FieldName[] = [
  "name",
  "teachingLanguageId",
  "tagsInput",
  "description",
  "shortDescription",
];

const NAME_MIN = 3;
const NAME_MAX = 100;
const SHORT_DESCRIPTION_MAX = 100;
const DESCRIPTION_MAX = 2000;
const TAGS_MAX = 10;
const TAG_MAX_LENGTH = 30;

export function validateCourseForm(draft: CourseDraft): FormErrors {
  const errors: FormErrors = {};

  const name = draft.name.trim();
  if (name === "") errors.name = "Enter a name for your course.";
  else if (name.length < NAME_MIN)
    errors.name = "Name must be at least 3 characters.";
  else if (name.length > NAME_MAX)
    errors.name = "Name must be 100 characters or fewer.";

  if (draft.teachingLanguageId === "")
    errors.teachingLanguageId = "Select the language you are teaching.";

  const tags = parseTags(draft.tagsInput);
  if (tags.length > TAGS_MAX) errors.tagsInput = "Use at most 10 tags.";
  else if (tags.some((tag) => tag.length > TAG_MAX_LENGTH))
    errors.tagsInput = "Each tag must be 30 characters or fewer.";

  if (draft.description.trim().length > DESCRIPTION_MAX)
    errors.description = "Description must be 2000 characters or fewer.";

  if (draft.shortDescription.trim().length > SHORT_DESCRIPTION_MAX)
    errors.shortDescription =
      "Short description must be 100 characters or fewer.";

  return errors;
}
