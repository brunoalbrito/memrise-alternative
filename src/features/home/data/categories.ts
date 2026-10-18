import type { Category } from "../model/types";
import { languageCategories } from "./languages";

/** Course categories. A course's category follows its teaching language (`lang-<id>`). */
export const allCategories: Category[] = languageCategories;

export function getCategoryById(id: string): Category | undefined {
  return allCategories.find((category) => category.id === id);
}
