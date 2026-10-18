import { createContext, useContext, type ReactNode } from "react";
import type { Course } from "../model/types";

/**
 * Lets the app shell add actions to Home without the home feature depending on other features
 * (a toolbar next to "Create a course", and an "Export course" item in the course menu).
 */
export interface HomeExtensions {
  toolbar?: ReactNode;
  exportCourse?: (course: Course) => void;
}

const HomeExtensionsContext = createContext<HomeExtensions>({});

export const HomeExtensionsProvider = HomeExtensionsContext.Provider;

export function useHomeExtensions(): HomeExtensions {
  return useContext(HomeExtensionsContext);
}
