import type { Category, Language } from "../model/types";

export const languages: Language[] = [
  { id: "en-gb", name: "English (UK)", icon: "🇬🇧" },
  { id: "en-us", name: "English (US)", icon: "🇺🇸" },
  { id: "es-mx", name: "Spanish (Mexico)", icon: "🇲🇽" },
  { id: "ja", name: "Japanese", icon: "🇯🇵" },
  { id: "pt-br", name: "Portuguese (Brazil)", icon: "🇧🇷" },
  { id: "fr-fr", name: "French (France)", icon: "🇫🇷" },
  { id: "de-de", name: "German", icon: "🇩🇪" },
  { id: "it-it", name: "Italian", icon: "🇮🇹" },
];

export const DEFAULT_SPEAKERS_LANGUAGE_ID = "en-gb";

export function getLanguageById(id: string): Language | undefined {
  return languages.find((language) => language.id === id);
}

export function categoryForLanguage(language: Language): Category {
  return { id: `lang-${language.id}`, name: language.name, icon: language.icon };
}

export const languageCategories: Category[] = languages.map(categoryForLanguage);
