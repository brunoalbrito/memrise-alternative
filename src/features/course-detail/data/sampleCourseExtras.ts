export interface CourseExtras {
  creator: string;
  /** Integer, 0 <= longTermCount <= itemsLearned */
  longTermCount: number;
  /** Integer >= 0, itemsLearned + ignoredCount <= totalItems */
  ignoredCount: number;
  levelNames: string[];
}

export const sampleCourseExtras: Record<string, CourseExtras> = {
  "english-visual-dictionary": {
    creator: "Ana Duarte",
    longTermCount: 40,
    ignoredCount: 3,
    levelNames: [
      "At Home",
      "Around Town",
      "Food and Drink",
      "Travel",
      "Work and School",
      "Nature",
    ],
  },
  "irregular-verbs": {
    creator: "Marcus Webb",
    longTermCount: 0,
    ignoredCount: 0,
    levelNames: ["Common Verbs", "Past Forms", "Tricky Verbs", "Review Set"],
  },
  "english-polyglot": {
    creator: "Polyglot Club",
    longTermCount: 0,
    ignoredCount: 2,
    levelNames: [
      "Greetings",
      "Daily Life",
      "Opinions",
      "Phrasal Verbs",
      "Idioms",
      "Business English",
    ],
  },
  "japanese-hiragana": {
    creator: "Yuki Tanaka",
    longTermCount: 30,
    ignoredCount: 0,
    levelNames: ["Vowels and K", "S and T", "N and H", "M, Y and R"],
  },
  "japanese-n5-vocab": {
    creator: "Yuki Tanaka",
    longTermCount: 90,
    ignoredCount: 5,
    levelNames: [
      "Numbers",
      "People",
      "Time",
      "Places",
      "Verbs",
      "Adjectives",
    ],
  },
  "spanish-mexico-basics": {
    creator: "Sofia Ramirez",
    longTermCount: 20,
    ignoredCount: 1,
    levelNames: ["Greetings", "Ordering Food", "Directions", "Small Talk"],
  },
  "networking-fundamentals": {
    creator: "Priya Nair",
    longTermCount: 4,
    ignoredCount: 0,
    levelNames: ["Layers", "Addressing", "Routing", "Troubleshooting"],
  },
  "empty-course": {
    creator: "Draft Team",
    longTermCount: 0,
    ignoredCount: 0,
    levelNames: [],
  },
};

export const defaultExtras: CourseExtras = {
  creator: "You",
  longTermCount: 0,
  ignoredCount: 0,
  levelNames: [],
};
