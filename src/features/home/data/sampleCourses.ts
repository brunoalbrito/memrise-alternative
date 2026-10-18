import type { Category, Course } from "../model/types";
import { countsFromLevels } from "../model/counts";
import { languageCategories } from "./languages";
import { sampleLevels } from "./sampleLevels";

export const sampleCategories: Category[] = [
  { id: "computers", name: "Computers & Engineering", icon: "💻" },
  { id: "english", name: "English", icon: "🇬🇧" },
  { id: "japanese", name: "Japanese", icon: "🇯🇵" },
  { id: "spanish-mx", name: "Spanish (Mexico)", icon: "🇲🇽" },
];

const baseSamples: Course[] = [
  {
    id: "english-visual-dictionary",
    title: "English Visual Dictionary",
    categoryId: "english",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 3,
    learnedToday: 0,
    teaching: false,
    teachingLanguageId: "en-gb",
    speakersLanguageId: "en-gb",
  },
  {
    id: "irregular-verbs",
    title: "Learn English Irregular Verbs • No Typing",
    categoryId: "english",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 0,
    learnedToday: 0,
    teaching: false,
    teachingLanguageId: "en-gb",
    speakersLanguageId: "en-gb",
  },
  {
    id: "english-polyglot",
    title: "Learn English for Polyglot • No Typing",
    categoryId: "english",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 0,
    learnedToday: 0,
    teaching: false,
    teachingLanguageId: "en-gb",
    speakersLanguageId: "en-gb",
  },
  {
    id: "japanese-hiragana",
    title: "Japanese Hiragana Starter",
    categoryId: "japanese",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 0,
    learnedToday: 12,
    teaching: true,
    teachingLanguageId: "ja",
    speakersLanguageId: "en-gb",
  },
  {
    id: "japanese-n5-vocab",
    title: "Japanese N5 Essential Vocabulary",
    categoryId: "japanese",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 2,
    learnedToday: 8,
    teaching: false,
    teachingLanguageId: "ja",
    speakersLanguageId: "en-gb",
  },
  {
    id: "spanish-mexico-basics",
    title: "Spanish (Mexico) Everyday Phrases",
    categoryId: "spanish-mx",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 1,
    learnedToday: 5,
    teaching: true,
    teachingLanguageId: "es-mx",
    speakersLanguageId: "en-gb",
  },
  {
    id: "networking-fundamentals",
    title:
      "Computer Networking Fundamentals: Protocols, Layers, Addressing, Routing and Troubleshooting for Beginners",
    categoryId: "computers",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 1,
    learnedToday: 0,
    teaching: false,
    teachingLanguageId: "en-us",
    speakersLanguageId: "en-us",
  },
  {
    id: "empty-course",
    title: "Coming Soon: New Course Draft",
    categoryId: "computers",
    totalItems: 0,
    itemsLearned: 0,
    itemsDue: 0,
    learnedToday: 0,
    teaching: true,
    teachingLanguageId: "en-gb",
    speakersLanguageId: "en-gb",
  },
];

/** Sample courses with word counts derived from their sample levels. */
export const sampleCourses: Course[] = baseSamples.map((course) => ({
  ...course,
  ...countsFromLevels(sampleLevels[course.id] ?? [], course.itemsDue),
}));

export function getCourseById(id: string): Course | undefined {
  return sampleCourses.find((course) => course.id === id);
}

export const allCategories: Category[] = [
  ...sampleCategories,
  ...languageCategories,
];

export function getCategoryById(id: string): Category | undefined {
  return allCategories.find((category) => category.id === id);
}
