import type { Category, Course } from "../model/types";
import { languageCategories } from "./languages";

export const sampleCategories: Category[] = [
  { id: "computers", name: "Computers & Engineering", icon: "💻" },
  { id: "english", name: "English", icon: "🇬🇧" },
  { id: "japanese", name: "Japanese", icon: "🇯🇵" },
  { id: "spanish-mx", name: "Spanish (Mexico)", icon: "🇲🇽" },
];

export const sampleCourses: Course[] = [
  {
    id: "english-visual-dictionary",
    title: "English Visual Dictionary",
    categoryId: "english",
    totalItems: 2363,
    itemsLearned: 159,
    itemsDue: 26,
    learnedToday: 0,
    teaching: false,
    teachingLanguageId: "en-gb",
    speakersLanguageId: "en-gb",
  },
  {
    id: "irregular-verbs",
    title: "Learn English Irregular Verbs • No Typing",
    categoryId: "english",
    totalItems: 697,
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
    totalItems: 5385,
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
    totalItems: 46,
    itemsLearned: 46,
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
    totalItems: 800,
    itemsLearned: 212,
    itemsDue: 41,
    learnedToday: 8,
    teaching: false,
    teachingLanguageId: "ja",
    speakersLanguageId: "en-gb",
  },
  {
    id: "spanish-mexico-basics",
    title: "Spanish (Mexico) Everyday Phrases",
    categoryId: "spanish-mx",
    totalItems: 420,
    itemsLearned: 97,
    itemsDue: 9,
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
    totalItems: 310,
    itemsLearned: 15,
    itemsDue: 3,
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
