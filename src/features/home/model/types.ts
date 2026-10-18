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
}

export const GOAL_VALUES = [5, 10, 20, 50] as const;
export type GoalValue = (typeof GOAL_VALUES)[number];

export type FilterValue = "all" | "goal" | "teaching" | `cat:${string}`;

export type PrimaryAction = "speed-review" | "learn-new-words";
