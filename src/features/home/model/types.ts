export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Course {
  id: string;
  title: string;
  categoryId: string;
  coverImage?: string;
  /** Integer >= 0 */
  totalItems: number;
  /** Integer, 0 <= itemsLearned <= totalItems */
  itemsLearned: number;
  /** Integer >= 0 */
  itemsDue: number;
  /** Integer >= 0; drives the goal ring */
  learnedToday: number;
  teaching: boolean;
  /** Learner-created courses only. Must exist in the language list. */
  teachingLanguageId?: string;
  /** Learner-created courses only. Must exist in the language list. */
  speakersLanguageId?: string;
  /** At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates */
  tags?: string[];
  /** At most 2000 characters */
  description?: string;
  /** At most 100 characters */
  shortDescription?: string;
}

/** Learner's saved changes to a pre-loaded sample course. Applied over the sample data. */
export interface CourseEdit {
  /** Trimmed, 3 to 100 characters */
  title?: string;
  teachingLanguageId?: string;
  speakersLanguageId?: string;
  /** At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates */
  tags?: string[];
  /** At most 2000 characters */
  description?: string;
  /** At most 100 characters */
  shortDescription?: string;
  /** Set to `lang-<teachingLanguageId>` only when the teaching language changed; otherwise the course's current category */
  categoryId?: string;
}

export interface Language {
  id: string;
  name: string;
  icon: string;
}

/** Raw values of the Create a Course form. */
export interface CourseDraft {
  /** Required. Trimmed length 3 to 100 */
  name: string;
  /** Required. Empty string means "Please select one..." */
  teachingLanguageId: string;
  /** Required, default en-gb */
  speakersLanguageId: string;
  /** Optional. Comma-separated */
  tagsInput: string;
  /** Optional. At most 2000 characters */
  description: string;
  /** Optional. At most 100 characters */
  shortDescription: string;
}

export const GOAL_VALUES = [5, 10, 20, 50] as const;
export type GoalValue = (typeof GOAL_VALUES)[number];

export type FilterValue = "all" | "goal" | "teaching" | `cat:${string}`;

export type PrimaryAction = "speed-review" | "learn-new-words";
