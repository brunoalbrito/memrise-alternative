import { useEffect } from "react";
import { RouterProvider } from "react-router/dom";
import { useAiStore } from "../features/ai-assistant";
import { HomeExtensionsProvider, useLearnerStore, useProgressStore } from "../features/home";
import { useExerciseSettings } from "../features/practice";
import { LibraryHost, LibraryToolbar, useExchangeStore } from "../features/library";
import { isDesktop } from "../shared/api";
import { router } from "./router";

export function App() {
  const ready = useLearnerStore((state) => state.ready);
  const loadError = useLearnerStore((state) => state.loadError);
  const hydrate = useLearnerStore((state) => state.hydrate);
  const hydrateAi = useAiStore((state) => state.hydrate);
  const refreshProgress = useProgressStore((state) => state.refresh);
  const hydrateExercises = useExerciseSettings((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateAi();
    void refreshProgress();
    void hydrateExercises();
    // Cards fall due while the app is open.
    const timer = setInterval(() => void refreshProgress(), 60_000);
    return () => clearInterval(timer);
  }, [hydrate, hydrateAi, refreshProgress, hydrateExercises]);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface p-6 text-center">
        <div>
          <h1 className="text-headline-medium text-on-surface">Your library could not be opened</h1>
          <p className="mt-2 text-body-large text-on-surface-variant">{loadError}</p>
        </div>
      </main>
    );
  }
  if (!ready) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-surface"
        aria-busy="true"
      >
        <p className="text-body-large text-on-surface-variant">Opening your library…</p>
      </main>
    );
  }
  return (
    <HomeExtensionsProvider
      value={{
        toolbar: <LibraryToolbar />,
        exportCourse: isDesktop()
          ? (course) => void useExchangeStore.getState().exportCourse(course)
          : undefined,
        exportAnki: isDesktop()
          ? (course) => void useExchangeStore.getState().exportAnki(course)
          : undefined,
      }}
    >
      <RouterProvider router={router} />
      {isDesktop() && <LibraryHost />}
    </HomeExtensionsProvider>
  );
}
