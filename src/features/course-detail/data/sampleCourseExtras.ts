export interface CourseExtras {
  creator: string;
  /** Integer, 0 <= longTermCount <= itemsLearned */
  longTermCount: number;
  /** Integer >= 0, itemsLearned + ignoredCount <= totalItems */
  ignoredCount: number;
}

export const sampleCourseExtras: Record<string, CourseExtras> = {
  "english-visual-dictionary": {
    creator: "Ana Duarte",
    longTermCount: 3,
    ignoredCount: 2,
  },
  "irregular-verbs": {
    creator: "Marcus Webb",
    longTermCount: 0,
    ignoredCount: 0,
  },
  "english-polyglot": {
    creator: "Polyglot Club",
    longTermCount: 0,
    ignoredCount: 1,
  },
  "japanese-hiragana": {
    creator: "Yuki Tanaka",
    longTermCount: 6,
    ignoredCount: 0,
  },
  "japanese-n5-vocab": {
    creator: "Yuki Tanaka",
    longTermCount: 2,
    ignoredCount: 1,
  },
  "spanish-mexico-basics": {
    creator: "Sofia Ramirez",
    longTermCount: 1,
    ignoredCount: 1,
  },
  "networking-fundamentals": {
    creator: "Priya Nair",
    longTermCount: 0,
    ignoredCount: 0,
  },
  "empty-course": {
    creator: "Draft Team",
    longTermCount: 0,
    ignoredCount: 0,
  },
};

export const defaultExtras: CourseExtras = {
  creator: "You",
  longTermCount: 0,
  ignoredCount: 0,
};
