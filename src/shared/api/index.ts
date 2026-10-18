import type { MembetterApi } from "../../../electron/shared/api";

export type { AppInfo, Result } from "../../../electron/shared/api";

declare global {
  interface Window {
    /** Present only inside the desktop app. */
    api?: MembetterApi;
  }
}

export const isDesktop = (): boolean => typeof window !== "undefined" && window.api !== undefined;

/** The desktop API. Throws outside the desktop app (plain browser build). */
export function getApi(): MembetterApi {
  if (!window.api) throw new Error("The desktop API is not available in the browser build.");
  return window.api;
}
