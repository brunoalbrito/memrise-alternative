import { useAppStore } from "../../shared/store/appStore";

export function HomePage() {
  const appName = useAppStore((state) => state.appName);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold">{appName}</h1>
    </main>
  );
}
